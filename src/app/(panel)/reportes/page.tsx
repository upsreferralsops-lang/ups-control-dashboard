import { getReports, type ReferralStatus, type Reportes } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { AvisoServicioIndisponible } from "@/components/AvisoServicioIndisponible";
import { Aviso, Bloque } from "@/components/ui";
import { FiltrosReportes } from "./FiltrosReportes";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Reportes y Métricas | UPS Talent Ops",
};

const RANGOS = new Set(["30d", "mes", "mes_ant", "anio", "todo"]);
const ESTADOS = new Set<ReferralStatus>([
  "sent_confirmed",
  "waiting_position",
  "not_started",
  "duplicate_or_error",
  "search_failed",
]);

function isoDia(d: Date) {
  return d.toISOString().slice(0, 10);
}

function ventana(rango: string, ahora = new Date()) {
  if (rango === "todo") return {};
  if (rango === "mes") {
    return { since: isoDia(new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))) };
  }
  if (rango === "mes_ant") {
    return {
      since: isoDia(new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1))),
      until: isoDia(new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 1))),
    };
  }
  if (rango === "anio") {
    return { since: isoDia(new Date(Date.UTC(ahora.getUTCFullYear(), 0, 1))) };
  }
  const desde = new Date(ahora);
  desde.setUTCDate(desde.getUTCDate() - 30);
  return { since: isoDia(desde) };
}

function fmtEntero(n: number) {
  return n.toLocaleString("es");
}

function fmtPct(parte: number, total: number) {
  if (total <= 0) return "0%";
  return `${((parte / total) * 100).toFixed(1)}%`;
}

function fmtDuracion(segundos: number | null) {
  if (segundos == null || !Number.isFinite(segundos) || segundos < 0) return "—";
  if (segundos < 60) return `${Math.round(segundos)} s`;
  if (segundos < 3600) return `${(segundos / 60).toFixed(1)} min`;
  if (segundos < 86400) return `${(segundos / 3600).toFixed(1)} h`;
  return `${(segundos / 86400).toFixed(1)} d`;
}

function proyeccionMes(referidos: number, ahora = new Date()) {
  const dia = ahora.getUTCDate();
  const dias = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 0)).getUTCDate();
  if (dia <= 0 || referidos <= 0) return null;
  return Math.round((referidos / dia) * dias);
}

function Barras({
  items,
  color,
}: {
  items: { nombre: string; cantidad: number }[];
  color: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-soft">Todavía no hay datos en este alcance.</p>;
  }
  const tope = Math.max(...items.map((i) => i.cantidad), 1);
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.nombre} className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-ink">{item.nombre}</span>
            <span className="shrink-0 font-semibold tabular-nums text-ink-soft">
              {fmtEntero(item.cantidad)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full ${color}`}
              style={{ width: `${(item.cantidad / tope) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ rango?: string; estado?: string; bot?: string }>;
}) {
  const { user, tenants } = await requireSession();
  const esAdmin = user.role === "admin";
  const params = await searchParams;
  const rango = params.rango && RANGOS.has(params.rango) ? params.rango : "30d";
  const estado = params.estado && ESTADOS.has(params.estado as ReferralStatus) ? params.estado : "todos";
  const botPedido = params.bot ?? "";
  const bot = tenants.some((t) => t.id === botPedido) ? botPedido : "";
  const { since, until } = ventana(rango);

  let reportes: Reportes;
  try {
    reportes = await getReports({
      tenantId: bot || undefined,
      since,
      until,
      referralStatus: estado === "todos" ? undefined : (estado as ReferralStatus),
    });
  } catch {
    return <AvisoServicioIndisponible from="/reportes" />;
  }

  const sinBots = !esAdmin && tenants.length === 0;
  const tasa = fmtPct(reportes.referidos, reportes.iniciados);
  const proyectado = rango === "mes" ? proyeccionMes(reportes.referidos) : null;
  const botActual = tenants.find((t) => t.id === bot);
  const pieAlcance = botActual
    ? botActual.name
    : tenants.length === 1
      ? (tenants[0]?.name ?? "Tu bot")
      : esAdmin
        ? "Alcance de todos los clientes"
        : "Solo tus bots";
  const etiquetaTodos = esAdmin
    ? `Todos los clientes (${tenants.length})`
    : `Todos tus bots (${tenants.length})`;

  const metricas = [
    {
      label: "Total candidatos",
      valor: fmtEntero(reportes.iniciados),
      pie: pieAlcance,
    },
    {
      label: "Tasa de conversión",
      valor: tasa,
      pie: `${fmtEntero(reportes.referidos)} referidos de ${fmtEntero(reportes.iniciados)}`,
    },
    {
      label: "Tiempo promedio",
      valor: fmtDuracion(reportes.tiempo_promedio_seg),
      pie: "Hasta confirmar el referido",
    },
    {
      label: proyectado != null ? "Proyección cierre mes" : "Referidos confirmados",
      valor: fmtEntero(proyectado ?? reportes.referidos),
      pie: proyectado != null ? "Al ritmo de este mes" : `${fmtEntero(reportes.en_espera)} en espera`,
    },
    {
      label: "Reactivados por vacante",
      valor: fmtEntero(reportes.reactivados_por_vacante ?? 0),
      pie: "Les escribimos de nuevo cuando reabrió cupo cerca",
    },
  ];

  return (
    <div className="flex min-w-0 w-full flex-col gap-5">
      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Reportes y Métricas</h1>
          <p className="text-sm text-ink-soft">
            {esAdmin
              ? "Rendimiento de todos los clientes, o de un bot puntual."
              : "Rendimiento de los bots que tenés asignados."}
          </p>
        </div>
      </header>

      {sinBots && (
        <Aviso tono="warn" titulo="Todavía no tenés bots asignados">
          Por eso no ves métricas. Pedile a un administrador que te asigne al menos uno.
        </Aviso>
      )}

      <Bloque className="min-w-0 bg-surface" cuerpoClassName="p-4 sm:p-5">
        <FiltrosReportes
          rango={rango}
          estado={estado}
          bot={bot}
          tenants={tenants.map((t) => ({ id: t.id, name: t.name }))}
          etiquetaTodos={etiquetaTodos}
        />
      </Bloque>

      {/* En movil dos columnas; la quinta metrica ocupa la fila entera. */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        {metricas.map((m) => (
          <div
            key={m.label}
            className="min-w-0 rounded-panel border border-line bg-surface p-3.5 max-sm:last:odd:col-span-2 sm:p-5"
          >
            <p className="text-xs font-medium leading-tight text-ink-soft sm:text-sm">{m.label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-ink sm:mt-2 sm:text-3xl">{m.valor}</p>
            <p className="mt-1 text-[11px] font-medium leading-snug text-ink-soft sm:text-xs">{m.pie}</p>
          </div>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2">
        <Bloque titulo="Top trabajos más aplicados" className="min-w-0">
          <Barras items={reportes.top_trabajos} color="bg-brand" />
        </Bloque>
        <Bloque titulo="Top estados (ubicación)" className="min-w-0">
          <Barras items={reportes.top_estados} color="bg-signal" />
        </Bloque>
      </div>

      <Bloque titulo="Embudo de conversión" className="min-w-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Iniciados", valor: reportes.iniciados },
            {
              label: "Datos completos",
              valor: reportes.datos_completos,
              tasa: fmtPct(reportes.datos_completos, reportes.iniciados),
            },
            {
              label: "Referidos a UPS",
              valor: reportes.referidos,
              tasa: fmtPct(reportes.referidos, reportes.datos_completos || reportes.iniciados),
            },
          ].map((paso) => (
            <div key={paso.label} className="min-w-0 rounded-lg bg-sunk px-2 py-2.5 text-center sm:px-4 sm:py-3">
              <span className="block text-[11px] font-semibold leading-tight text-ink-soft max-sm:min-h-[2lh] sm:text-xs">
                {paso.label}
              </span>
              <span className="mt-1 block text-xl font-bold tabular-nums text-ink sm:text-2xl">
                {fmtEntero(paso.valor)}
              </span>
              {"tasa" in paso && paso.tasa && (
                <span className="text-xs font-medium text-ok">{paso.tasa}</span>
              )}
            </div>
          ))}
        </div>
      </Bloque>
    </div>
  );
}
