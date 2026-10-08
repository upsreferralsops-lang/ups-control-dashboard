import Link from "next/link";
import {
  CoreApiError,
  getCredits,
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
  type TenantCredits,
} from "@/lib/api";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import {
  IconoCandidatos,
  IconoChevron,
  IconoConsulta,
  IconoEdificio,
  IconoEnviar,
  IconoPersonaCheck,
} from "@/lib/icons";
import { fullName, presentacionReferido, timeAgo } from "@/lib/status";
import { PANEL_ADMIN_CLIENTES_BOTS } from "@/lib/features";
import { esCanalActivo } from "@/lib/canales";
import { nombreVisibleCliente } from "@/lib/etiquetas-cliente";
import { SelectorCliente } from "./SelectorCliente";
import { RenovarSesionBoton } from "./RenovarSesionBoton";

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
    <div className={`${CARD} flex flex-col justify-between p-3.5 sm:p-5`}>
      <div className="flex items-start justify-between gap-2 text-ink-soft">
        {/* En movil el titulo reserva dos lineas: asi los numeros de cada fila quedan alineados. */}
        <span className="text-[11px] font-medium uppercase leading-tight tracking-wider max-sm:min-h-[2lh] sm:text-xs">
          {titulo}
        </span>
        <Icono className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${iconoColor}`} />
      </div>
      <div className="my-2 sm:my-3">
        <div className="text-2xl font-bold tracking-tight tabular-nums text-brand sm:text-3xl">
          {valor.toLocaleString("es")}
        </div>
      </div>
      <div className={`text-[11px] font-medium leading-snug sm:text-xs ${pieTono === "ok" ? "text-ok" : "text-ink-soft"}`}>
        {pie}
      </div>
    </div>
  );
}

/* --- Estado de clientes y bots -------------------------------------------- */

type Fila = {
  id: string;
  nombre: string;
  channels: TenantChannel[];
  porCanal: Partial<Record<TenantChannel["channel"], number>>;
  candidatos: number | null;
  creditos?: TenantCredits;
};

const CANALES = ([
  { channel: "whatsapp", label: "Bot WhatsApp", Icono: IconoEnviar, color: "text-ok" },
  { channel: "telegram", label: "Bot Telegram", Icono: IconoEnviar, color: "text-sky-600" },
] as const).filter((c) => esCanalActivo(c.channel));

function estadoCanal(ch?: TenantChannel) {
  const activo = ch?.active ?? false;
  return {
    estado: !ch ? "Sin conectar" : activo ? "Activo" : "En pausa",
    estadoTexto: !ch ? "text-ink-faint" : activo ? "text-ok-ink" : "text-warn-ink",
    estadoPunto: !ch ? "bg-ink-faint/50" : activo ? "bg-ok" : "bg-warn",
  };
}

function colorCreditos(f: Fila) {
  if (!f.creditos?.alerta) return "text-brand";
  return f.creditos.nivel === "agotado" ? "text-bad-ink" : "text-warn-ink";
}

const textoCreditos = (f: Fila) =>
  f.creditos?.remaining_usd == null ? "—" : `US$ ${f.creditos.remaining_usd.toFixed(2)}`;

/** Consumo de la key del bot: lo que distingue a un cliente de otro. El
 *  saldo es de la cuenta de OpenRouter y sale igual para todas sus keys. */
const textoConsumo = (f: Fila) => {
  const usd = f.creditos?.usage_usd;
  if (usd == null) return "—";
  return `US$ ${usd > 0 && usd < 0.01 ? usd.toFixed(3) : usd.toFixed(2)}`;
};

const textoCandidatos = (f: Fila) =>
  f.candidatos == null ? "—" : `${f.candidatos.toLocaleString("es")} candidatos`;

/** Movil: el cliente entra en dos lineas. Nombre lleva al detalle; estado y cifras a la vista. */
function FilaClienteCompacta({ f }: { f: Fila }) {
  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/candidatos?bot=${f.id}`}
          className="inline-flex min-w-0 items-center gap-1 rounded-control text-sm font-semibold text-brand"
        >
          <span className="truncate">{f.nombre}</span>
          <IconoChevron className="h-4 w-4 shrink-0 -rotate-90 text-ink-faint" />
        </Link>
        <span className="flex shrink-0 items-center gap-3">
          {CANALES.map(({ channel, label, Icono, color }) => {
            const ch = f.channels.find((c) => c.channel === channel);
            const { estado, estadoTexto, estadoPunto } = estadoCanal(ch);
            return (
              <span
                key={channel}
                title={label}
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${estadoTexto}`}
              >
                <Icono className={`h-3.5 w-3.5 ${ch ? color : "text-ink-faint"}`} />
                <span className={`h-1.5 w-1.5 rounded-full ${estadoPunto}`} aria-hidden />
                {estado}
              </span>
            );
          })}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-xs text-ink-soft tabular-nums">
          <span className="font-semibold text-brand">{textoCandidatos(f)}</span>
          {" · "}
          <span className="font-semibold text-brand">{textoConsumo(f)}</span> consumo
          {f.creditos?.alerta ? (
            <span className={`font-semibold ${colorCreditos(f)}`}> · saldo {textoCreditos(f)}</span>
          ) : null}
        </p>
        <RenovarSesionBoton tenantId={f.id} />
      </div>
    </div>
  );
}

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
  const { estado, estadoTexto, estadoPunto } = estadoCanal(ch);

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
    // Un solo hijo por cliente: asi divide-y separa clientes y no deja linea de mas.
    <div>
      <FilaClienteCompacta f={f} />
      <div className="flex flex-col justify-between gap-5 p-6 transition-colors hover:bg-sunk/40 max-sm:hidden lg:flex-row lg:items-center">
        <div className="shrink-0 lg:w-64">
          <div className="text-sm font-semibold text-brand">{f.nombre}</div>
        </div>
  
        <div className={`grid flex-1 grid-cols-1 gap-4 ${CANALES.length > 1 ? "sm:grid-cols-2" : ""}`}>
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
  
        {/* En movil: cifras en una fila y acciones debajo, a la derecha. */}
        <div className="flex shrink-0 flex-wrap items-center gap-4 pt-2 lg:flex-nowrap lg:justify-end lg:pt-0">
          <div className="flex gap-4">
            <div className="lg:text-right">
              <div className="text-xs font-medium text-ink-soft">Consumo bot</div>
              <div className="text-sm font-bold tabular-nums text-brand">{textoConsumo(f)}</div>
              <div
                className={`text-[11px] tabular-nums ${f.creditos?.alerta ? `font-semibold ${colorCreditos(f)}` : "text-ink-faint"}`}
                title="Saldo de la cuenta de OpenRouter: es el mismo para todas sus keys"
              >
                saldo {textoCreditos(f)}
              </div>
            </div>
            <div className="lg:text-right">
              <div className="text-xs font-medium text-ink-soft">Total Cliente</div>
              <div className="text-sm font-bold tabular-nums text-brand">{textoCandidatos(f)}</div>
            </div>
          </div>
          <div className="ml-auto flex items-start gap-4">
            <RenovarSesionBoton tenantId={f.id} />
            <Link
              href={`/candidatos?bot=${f.id}`}
              title="Ver detalle"
              className="whitespace-nowrap rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sunk"
            >
              Detalle
            </Link>
          </div>
        </div>
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
  const creditosPorTenant = new Map<string, TenantCredits>();

  try {
    if (esAdmin) {
      const [m, rec, ats, aus, creditos] = await Promise.all([
        getMetrics(3, cliente || undefined),
        listCandidates({ tenantId: cliente || undefined }, 5),
        listTenants(),
        listUsers(),
        getCredits().catch(() => null),
      ]);
      metrics = m;
      recientes = rec;
      adminTenants = ats;
      adminUsers = aus;
      for (const item of creditos?.tenants ?? []) {
        creditosPorTenant.set(item.tenant_id, item);
      }
    } else {
      const [m, rec, creditos] = await Promise.all([
        getMetrics(3, cliente || undefined),
        listCandidates({ tenantId: cliente || undefined }, 5),
        getCredits().catch(() => null),
      ]);
      metrics = m;
      recientes = rec;
      for (const item of creditos?.tenants ?? []) {
        creditosPorTenant.set(item.tenant_id, item);
      }
    }
  } catch (error) {
    return <AvisoCore mensaje={error instanceof CoreApiError ? error.message : "Error inesperado."} />;
  }

  const canalesDe = (raw: TenantChannel[] | undefined): TenantChannel[] =>
    Array.isArray(raw) ? raw : [];

  // Admin: una fila por cliente, con o sin bot. Cliente: sus bots asignados.
  const todas: Fila[] =
    esAdmin && adminTenants && adminUsers
      ? adminTenants.map((t) => {
          return {
            id: t.id,
            nombre: nombreVisibleCliente(t.id, adminUsers),
            channels: canalesDe(t.channels),
            porCanal: t.candidatos_por_canal ?? {},
            candidatos: t.candidatos,
            creditos: creditosPorTenant.get(t.id),
          };
        })
      : tenants.map((t) => {
          const porCanal = t.candidatos_por_canal ?? {};
          return {
            id: t.id,
            nombre: user.name ?? user.email,
            channels: canalesDe(t.channels),
            porCanal,
            creditos: creditosPorTenant.get(t.id),
            // El core no le da el total por bot a un cliente, pero la suma por
            // canal es ese mismo total y sale de la misma consulta.
            candidatos: Object.values(porCanal).reduce((n, v) => n + (v ?? 0), 0),
          };
        });

  todas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const filas = cliente ? todas.filter((f) => f.id === cliente) : todas;
  const tieneTelegram = (f: Fila) => f.channels.some((c) => esCanalActivo(c.channel));
  const clientesConBot = filas.filter(tieneTelegram).length;
  const botsActivos = filas.reduce(
    (n, f) => n + f.channels.filter((c) => esCanalActivo(c.channel) && c.active).length,
    0,
  );
  const sinBot = filas.length - clientesConBot;
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
            Visión global de clientes y sus bots de Telegram.
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
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        <Kpi
          titulo="Total Candidatos"
          valor={metrics.total}
          pie={`${metrics.en_aplicacion} en proceso de aplicación`}
          Icono={IconoCandidatos}
          iconoColor="text-brand/70"
        />
        <Kpi
          titulo="Clientes Activos"
          valor={clientesConBot}
          pie={`${botsActivos} bots en operación · ${filas.length} clientes`}
          Icono={IconoEdificio}
          iconoColor="text-signal"
        />
        <Kpi
          titulo="Referidos enviados"
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
      <div className={`${CARD} shrink-0 overflow-hidden`}>
        <div className="flex items-center justify-between gap-3 border-b border-line/50 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-brand">Estado de Clientes &amp; Bots</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {filas.length} cliente{filas.length === 1 ? "" : "s"}
              {sinBot > 0 ? ` · ${sinBot} sin bot de Telegram` : ""}.
              Aparecen todos, tengan o no canal conectado.
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
