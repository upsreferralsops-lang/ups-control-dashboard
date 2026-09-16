import Link from "next/link";
import {
  CoreApiError,
  getMetrics,
  listCandidates,
  listTenants,
  listUsers,
  type AdminTenant,
  type AdminUser,
  type Candidate,
  type Metrics,
  type ReferralStatus,
  type TenantChannel,
} from "@/lib/api";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import {
  IconoCandidatos,
  IconoConsulta,
  IconoConversacion,
  IconoEdificio,
  IconoEnviar,
  IconoPersonaCheck,
} from "@/lib/icons";
import { fullName, presentacionReferido, timeAgo } from "@/lib/status";
import { PANEL_ADMIN_CLIENTES_BOTS } from "@/lib/features";
import { SelectorCliente } from "./SelectorCliente";

export const dynamic = "force-dynamic";

const CARD = "rounded-xl border border-line/60 bg-surface shadow-sm";

function AvisoCore({ mensaje }: { mensaje: string }) {
  return (
    <Aviso tono="bad" titulo="No se pudo leer el core">
      <p>{mensaje}</p>
      <p className="mt-2 overflow-x-auto whitespace-nowrap rounded-control bg-sunk px-2 py-1.5 text-xs text-ink-faint">
        venv/Scripts/python.exe -m uvicorn app.api.main:app --port 8090
      </p>
    </Aviso>
  );
}

/* --- KPIs ----------------------------------------------------------------- */

function Kpi({
  titulo,
  valor,
  pie,
  pieTono = "neutro",
  Icono,
  iconoColor,
}: {
  titulo: string;
  valor: number;
  pie: string;
  pieTono?: "neutro" | "ok";
  Icono: (props: { className?: string }) => React.ReactElement;
  iconoColor: string;
}) {
  return (
    <div className={`${CARD} flex flex-col justify-between p-5`}>
      <div className="flex items-start justify-between gap-2 text-ink-soft">
        <span className="text-xs font-medium uppercase tracking-wider">{titulo}</span>
        <Icono className={`h-5 w-5 shrink-0 ${iconoColor}`} />
      </div>
      <div className="my-3">
        <div className="text-3xl font-bold tracking-tight tabular-nums text-brand">
          {valor.toLocaleString("es")}
        </div>
      </div>
      <div className={`text-xs font-medium ${pieTono === "ok" ? "text-ok" : "text-ink-soft"}`}>
        {pie}
      </div>
    </div>
  );
}

/* --- Estado de clientes y bots -------------------------------------------- */

type Fila = {
  id: string;
  nombre: string;
  meta: string;
  channels: TenantChannel[];
  porCanal: Partial<Record<TenantChannel["channel"], number>>;
  candidatos: number | null;
};

const CANALES = [
  { channel: "whatsapp", label: "Bot WhatsApp", Icono: IconoConversacion, color: "text-ok" },
  { channel: "telegram", label: "Bot Telegram", Icono: IconoEnviar, color: "text-sky-600" },
] as const;

function TarjetaBot({
  label,
  Icono,
  color,
  ch,
  atendidos,
}: {
  label: string;
  Icono: (props: { className?: string }) => React.ReactElement;
  color: string;
  ch?: TenantChannel;
  atendidos?: number;
}) {
  const activo = ch?.active ?? false;
  const estado = !ch ? "Sin conectar" : activo ? "Activo" : "En pausa";
  const estadoTexto = !ch ? "text-ink-faint" : activo ? "text-ok-ink" : "text-warn-ink";
  const estadoPunto = !ch ? "bg-ink-faint/50" : activo ? "bg-ok" : "bg-warn";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line/50 bg-sunk/70 p-3">
      <Icono className={`h-5 w-5 shrink-0 ${ch ? color : "text-ink-faint"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold">{label}</span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${estadoTexto}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estadoPunto}`} aria-hidden />
            {estado}
          </span>
        </div>
        <div className="mt-0.5 text-[11px] text-ink-soft tabular-nums">
          {atendidos ?? 0} candidatos atendidos
        </div>
      </div>
    </div>
  );
}

function FilaCliente({ f }: { f: Fila }) {
  return (
    <div className="flex flex-col justify-between gap-5 p-6 transition-colors hover:bg-sunk/40 lg:flex-row lg:items-center">
      <div className="w-64 shrink-0">
        <div className="text-sm font-semibold text-brand">{f.nombre}</div>
        <div className="mt-0.5 font-mono text-xs text-ink-soft">{f.meta}</div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
        {CANALES.map(({ channel, label, Icono, color }) => (
          <TarjetaBot
            key={channel}
            label={label}
            Icono={Icono}
            color={color}
            ch={f.channels.find((c) => c.channel === channel)}
            atendidos={f.porCanal[channel]}
          />
        ))}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 pt-2 lg:justify-end lg:pt-0">
        <div className="text-right">
          <div className="text-xs font-medium text-ink-soft">Total Cliente</div>
          <div className="text-sm font-bold tabular-nums text-brand">
            {f.candidatos == null ? "—" : `${f.candidatos.toLocaleString("es")} candidatos`}
          </div>
        </div>
        <Link
          href={`/candidatos?bot=${f.id}`}
          title="Ver detalle"
          className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sunk"
        >
          Detalle
        </Link>
      </div>
    </div>
  );
}

/* --- Actividad reciente ---------------------------------------------------- */

const PUNTO_ESTADO: Record<ReferralStatus, string> = {
  sent_confirmed: "bg-ok",
  waiting_position: "bg-warn",
  duplicate_or_error: "bg-attention",
  search_failed: "bg-bad",
  not_started: "bg-info",
};

/** "8 min" -> "Hace 8 min"; "recién"/"ayer" ya se leen solos. */
function cuando(iso: string | null) {
  const t = timeAgo(iso);
  return t === "recién" || t === "ayer" || t === "—" ? t : `Hace ${t}`;
}

/* --- Pagina ---------------------------------------------------------------- */

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { user, tenants } = await requireSession();
  const esAdmin = user.role === "admin";
  const { cliente = "" } = await searchParams;

  let metrics: Metrics;
  let recientes: Candidate[];
  let adminTenants: AdminTenant[] | null = null;
  let adminUsers: AdminUser[] | null = null;

  try {
    if (esAdmin) {
      [metrics, recientes, adminTenants, adminUsers] = await Promise.all([
        getMetrics(3, cliente || undefined),
        listCandidates({ tenantId: cliente || undefined }, 5),
        listTenants(),
        listUsers(),
      ]);
    } else {
      [metrics, recientes] = await Promise.all([
        getMetrics(3, cliente || undefined),
        listCandidates({ tenantId: cliente || undefined }, 5),
      ]);
    }
  } catch (error) {
    return <AvisoCore mensaje={error instanceof CoreApiError ? error.message : "Error inesperado."} />;
  }

  // Admin: una fila por cliente, identificada por quien lo opera. Cliente: su
  // propio bot, donde el dueno es el mismo usuario que mira la pantalla.
  const todas: Fila[] =
    esAdmin && adminTenants && adminUsers
      ? adminTenants.map((t) => {
          const owners = adminUsers!.filter(
            (u) => u.role === "client" && u.tenants.some((tt) => tt.id === t.id),
          );
          const alta = t.created_at ? new Date(t.created_at).getFullYear() : null;
          return {
            id: t.id,
            nombre:
              owners.length > 0
                ? owners.map((o) => o.name ?? o.email).join(", ")
                : "Sin usuario asignado",
            meta: `ID: ${t.slug}${alta ? ` · Alta ${alta}` : ""}`,
            channels: t.channels ?? [],
            porCanal: t.candidatos_por_canal ?? {},
            candidatos: t.candidatos,
          };
        })
      : tenants.map((t) => {
          const alta = t.created_at ? new Date(t.created_at).getFullYear() : null;
          const porCanal = t.candidatos_por_canal ?? {};
          return {
            id: t.id,
            nombre: user.name ?? user.email,
            meta: `ID: ${t.slug}${alta ? ` · Alta ${alta}` : ""}`,
            channels: t.channels ?? [],
            porCanal,
            // El core no le da el total por bot a un cliente, pero la suma por
            // canal es ese mismo total y sale de la misma consulta.
            candidatos: Object.values(porCanal).reduce((n, v) => n + (v ?? 0), 0),
          };
        });

  const filas = cliente ? todas.filter((f) => f.id === cliente) : todas;
  const botsActivos = filas.reduce((n, f) => n + f.channels.filter((c) => c.active).length, 0);
  const tasaExito = metrics.total > 0 ? ((metrics.referidos_ok / metrics.total) * 100).toFixed(1) : "0.0";
  const sinBots = !esAdmin && tenants.length === 0;

  return (
    <>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            {esAdmin ? "Resumen Operativo" : "Tu Resumen"}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Visión global de clientes y canales conversacionales (WhatsApp &amp; Telegram).
          </p>
        </div>
        {todas.length > 1 && (
          <div className="self-start sm:self-auto">
            <SelectorCliente
              opciones={todas.map((f) => ({ id: f.id, nombre: f.nombre }))}
              actual={cliente}
            />
          </div>
        )}
      </div>

      {sinBots && (
        <Aviso tono="warn" titulo="Todavía no tenés bots asignados">
          Por eso no ves candidatos. Pedile a un administrador que te asigne al menos uno.
        </Aviso>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          titulo="Total Candidatos"
          valor={metrics.total}
          pie={`${metrics.en_aplicacion} en proceso de aplicación`}
          Icono={IconoCandidatos}
          iconoColor="text-brand/70"
        />
        <Kpi
          titulo="Clientes Activos"
          valor={filas.length}
          pie={`${botsActivos} bots en operación`}
          Icono={IconoEdificio}
          iconoColor="text-signal"
        />
        <Kpi
          titulo="Referidos a UPS"
          valor={metrics.referidos_ok}
          pie={`${tasaExito}% tasa de éxito en traspaso`}
          pieTono="ok"
          Icono={IconoPersonaCheck}
          iconoColor="text-ok"
        />
        <Kpi
          titulo="Derivaciones / Alertas"
          valor={metrics.con_datos_sensibles}
          pie="Casos pendientes de revisión"
          Icono={IconoConsulta}
          iconoColor="text-warn"
        />
      </div>

      {/* Estado de Clientes & Bots */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-line/50 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-brand">Estado de Clientes &amp; Bots</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              Cada cliente opera con un bot de WhatsApp y un bot de Telegram dedicados.
            </p>
          </div>
          {esAdmin && PANEL_ADMIN_CLIENTES_BOTS && (
            <Link
              href="/admin"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-signal-ink transition-colors hover:text-brand"
            >
              Gestionar todos <span aria-hidden>→</span>
            </Link>
          )}
        </div>

        {filas.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-soft">
            {esAdmin ? "Todavía no hay clientes creados." : "Todavía no tenés bots asignados."}
          </p>
        ) : (
          <div className="divide-y divide-line/40">
            {filas.map((f) => (
              <FilaCliente key={f.id} f={f} />
            ))}
          </div>
        )}
      </div>

      {/* Actividad Reciente */}
      <div className={`${CARD} p-6`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-brand">Actividad Reciente</h3>
          <Link
            href="/candidatos"
            className="text-xs text-ink-soft transition-colors hover:text-brand"
          >
            Ver todos →
          </Link>
        </div>

        {recientes.length === 0 ? (
          <p className="text-sm text-ink-soft">Todavía no hay actividad.</p>
        ) : (
          <div className="space-y-3">
            {recientes.map((c, i) => (
              <div
                key={c.id}
                className={`flex items-center justify-between gap-3 py-1.5 text-xs ${
                  i < recientes.length - 1 ? "border-b border-line/30" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${PUNTO_ESTADO[c.referral_status]}`}
                    aria-hidden
                  />
                  <Link
                    href={`/candidatos/${c.id}`}
                    className="truncate font-medium text-ink hover:underline"
                  >
                    <strong className="font-semibold text-brand">
                      {c.tenant_name ?? "Sin bot"}:
                    </strong>{" "}
                    {fullName(c)} — {presentacionReferido(c).label}
                  </Link>
                </div>
                <span className="ml-4 shrink-0 font-mono text-[11px] text-ink-soft">
                  {cuando(c.last_candidate_message_at ?? c.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
