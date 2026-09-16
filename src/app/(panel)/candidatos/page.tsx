import Link from "next/link";
import {
  CoreApiError,
  getMetrics,
  listCandidates,
  type Candidate,
  type Metrics,
  type ReferralStatus,
} from "@/lib/api";
import { requireSession } from "@/lib/session";
import { Aviso, Estado } from "@/components/ui";
import { IconoOrden } from "@/lib/icons";
import { Buscador } from "./Buscador";
import { fullName, presentacionReferido, statusOf, timeAgo } from "@/lib/status";

export const dynamic = "force-dynamic";

const FILTROS: { value: ReferralStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sent_confirmed", label: "Referidos" },
  { value: "waiting_position", label: "En espera" },
  { value: "duplicate_or_error", label: "Fallidos" },
  { value: "search_failed", label: "Búsqueda falló" },
  { value: "not_started", label: "Sin referir" },
];

const RANGO_ESTADO: Record<string, number> = {
  search_failed: 0,
  duplicate_or_error: 1,
  waiting_position: 2,
  not_started: 3,
  sent_confirmed: 4,
};

const ORDENES = {
  candidato: (c: Candidate) => fullName(c).toLocaleLowerCase("es"),
  zona: (c: Candidate) => (c.city ?? "zzzz").toLocaleLowerCase("es"),
  estado: (c: Candidate) => RANGO_ESTADO[c.referral_status] ?? 9,
  actividad: (c: Candidate) => new Date(c.last_candidate_message_at ?? c.created_at).getTime(),
} as const;

type Orden = keyof typeof ORDENES;
const esOrden = (v: string): v is Orden => v in ORDENES;

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

function Barra({ metrics, cola }: { metrics: Metrics; cola: (v: string) => string }) {
  const celdas = [
    { label: "Referidos", value: metrics.referidos_ok, color: "bg-ok", filtro: "sent_confirmed" },
    {
      label: "En espera",
      value: metrics.en_lista_de_espera,
      color: "bg-warn",
      filtro: "waiting_position",
    },
    {
      label: "Fallidos",
      value: metrics.referidos_fallidos,
      color: "bg-bad",
      filtro: "duplicate_or_error",
    },
    { label: "Abandonados", value: metrics.abandonados, color: "bg-ink-faint", filtro: null },
    { label: "Aplicando", value: metrics.en_aplicacion, color: "bg-info", filtro: null },
  ];

  return (
    <div className="flex flex-col gap-6 rounded-panel border border-line bg-surface px-6 py-5 sm:flex-row sm:items-end">
      <div className="sm:pr-8">
        <p className="eyebrow">Candidatos</p>
        <p className="mt-1 text-4xl font-semibold leading-none tabular-nums tracking-tight">
          {metrics.total}
        </p>
        {metrics.con_datos_sensibles > 0 && (
          <p className="mt-2 text-[11px] font-semibold text-warn-ink">
            {metrics.con_datos_sensibles} con dato sensible
          </p>
        )}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 border-line sm:grid-cols-5 sm:border-l sm:pl-8">
        {celdas.map((c) => {
          const parte = metrics.total > 0 ? (c.value / metrics.total) * 100 : 0;
          const cuerpo = (
            <>
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.color}`} aria-hidden />
                <span className="truncate text-xs text-ink-soft">{c.label}</span>
              </div>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">{c.value}</p>
              <div className="mt-1.5 h-0.5 w-full bg-sunk" aria-hidden>
                <div className={`h-full ${c.color}`} style={{ width: `${parte}%` }} />
              </div>
            </>
          );

          return c.filtro ? (
            <Link
              key={c.label}
              href={cola(c.filtro)}
              title={`Filtrar por ${c.label.toLowerCase()}`}
              className="rounded-control transition-opacity duration-150 hover:opacity-70"
            >
              {cuerpo}
            </Link>
          ) : (
            <div key={c.label}>{cuerpo}</div>
          );
        })}
      </div>
    </div>
  );
}

function Duenos({ c }: { c: Candidate }) {
  return (
    <td className="px-3 py-2.5">
      <p className="font-medium">{c.tenant_name ?? "sin bot"}</p>
      <p className="mt-0.5 truncate text-xs text-ink-soft">
        {c.owners.length > 0
          ? c.owners.map((o) => o.name ?? o.email).join(", ")
          : "sin usuario asignado"}
      </p>
    </td>
  );
}

function Th({
  label,
  campo,
  orden,
  dir,
  href,
  alDerecha = false,
}: {
  label: string;
  campo?: Orden;
  orden: Orden;
  dir: "asc" | "desc";
  href: (campo: Orden) => string;
  alDerecha?: boolean;
}) {
  const alineacion = alDerecha ? "text-right" : "text-left";

  if (!campo) {
    return (
      <th scope="col" className={`px-3 py-2 ${alineacion}`}>
        <span className="eyebrow">{label}</span>
      </th>
    );
  }

  const activa = orden === campo;
  return (
    <th
      scope="col"
      aria-sort={activa ? (dir === "asc" ? "ascending" : "descending") : "none"}
      className={`px-3 py-2 ${alineacion}`}
    >
      <Link
        href={href(campo)}
        className={`inline-flex items-center gap-1 rounded-control ${
          alDerecha ? "flex-row-reverse" : ""
        }`}
      >
        <span className={`eyebrow ${activa ? "text-ink" : ""}`}>{label}</span>
        <IconoOrden direccion={activa ? dir : null} className="h-3 w-3 text-ink-faint" />
      </Link>
    </th>
  );
}

function Tabla({
  candidatos,
  verDueno,
  orden,
  dir,
  href,
}: {
  candidatos: Candidate[];
  verDueno: boolean;
  orden: Orden;
  dir: "asc" | "desc";
  href: (campo: Orden) => string;
}) {
  if (candidatos.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium">Ningún candidato coincide</p>
        <p className="mt-1 text-sm text-ink-soft">
          Probá con menos filtros, o buscá por correo o teléfono.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-auto rounded-panel border border-line bg-surface">
      <table className="tabla-pegajosa w-full text-sm">
        <thead>
          <tr>
            <Th label="Candidato" campo="candidato" orden={orden} dir={dir} href={href} />
            <Th label="Contacto" orden={orden} dir={dir} href={href} />
            <Th label="Zona" campo="zona" orden={orden} dir={dir} href={href} />
            <Th label="Posición elegida" orden={orden} dir={dir} href={href} />
            {verDueno && <Th label="Bot / usuario" orden={orden} dir={dir} href={href} />}
            <Th label="Estado" campo="estado" orden={orden} dir={dir} href={href} />
            <Th
              label="Últ. mensaje"
              campo="actividad"
              orden={orden}
              dir={dir}
              href={href}
              alDerecha
            />
          </tr>
        </thead>
        <tbody>
          {candidatos.map((c) => (
            <tr
              key={c.id}
              className="border-t border-line/60 transition-colors duration-100 hover:bg-sunk/60"
            >
              <td className="px-3 py-2.5">
                <Link
                  href={`/candidatos/${c.id}`}
                  className="rounded-control font-medium decoration-signal decoration-2 underline-offset-4 hover:underline"
                >
                  {fullName(c)}
                </Link>
                {c.sensitive_data_received && (
                  <span
                    title="Envió un dato sensible por chat; el sistema lo descartó antes de guardarlo"
                    className="ml-2 whitespace-nowrap rounded-full border border-warn-border bg-warn-wash px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warn-ink"
                  >
                    dato sensible
                  </span>
                )}
              </td>
              <td className="px-3 py-2.5 text-ink-soft">
                <div className="max-w-52 truncate">{c.email ?? "—"}</div>
                <div className="text-xs tabular-nums text-ink-faint">{c.phone ?? "—"}</div>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">
                {c.city ?? "—"}
                {c.zip && <span className="ml-1.5 text-xs tabular-nums text-ink-faint">{c.zip}</span>}
              </td>
              <td className="max-w-56 px-3 py-2.5 text-ink-soft">
                <span className="line-clamp-2">{c.matched_warehouse_name ?? "—"}</span>
              </td>
              {verDueno && <Duenos c={c} />}
              <td className="px-3 py-2.5" title={presentacionReferido(c).help}>
                <Estado status={c.referral_status} candidate={c} />
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right text-xs tabular-nums text-ink-faint">
                {timeAgo(c.last_candidate_message_at ?? c.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Panel({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; q?: string; bot?: string; orden?: string; dir?: string }>;
}) {
  const { tenants, user } = await requireSession();
  const params = await searchParams;
  const { estado, q = "", bot = "" } = params;
  const filtro = (estado ?? "todos") as ReferralStatus | "todos";
  const orden: Orden = params.orden && esOrden(params.orden) ? params.orden : "actividad";
  const dir: "asc" | "desc" = params.dir === "asc" ? "asc" : "desc";

  let metrics: Metrics;
  let candidatos: Candidate[];
  try {
    [metrics, candidatos] = await Promise.all([
      getMetrics(),
      listCandidates({
        referralStatus: filtro === "todos" ? undefined : filtro,
        tenantId: bot || undefined,
        q: q.trim() || undefined,
      }),
    ]);
  } catch (error) {
    return (
      <AvisoCore mensaje={error instanceof CoreApiError ? error.message : "Error inesperado."} />
    );
  }

  const clave = ORDENES[orden];
  const ordenados = candidatos.slice().sort((a, b) => {
    const x = clave(a);
    const y = clave(b);
    const cmp =
      typeof x === "string" ? x.localeCompare(y as string, "es") : (x as number) - (y as number);
    return dir === "asc" ? cmp : -cmp;
  });

  const sinBots = user.role === "client" && tenants.length === 0;
  const verDueno = user.role === "admin" || tenants.length > 1;

  const url = (cambios: { estado?: string; orden?: Orden; dir?: "asc" | "desc" }) => {
    const p = new URLSearchParams();
    const e = cambios.estado ?? (filtro === "todos" ? "" : filtro);
    const o = cambios.orden ?? orden;
    const d = cambios.dir ?? dir;
    if (e) p.set("estado", e);
    if (q) p.set("q", q);
    if (bot) p.set("bot", bot);
    if (o !== "actividad") p.set("orden", o);
    if (d !== "desc") p.set("dir", d);
    return p.toString() ? `/candidatos?${p}` : "/candidatos";
  };

  const cola = (v: string) => url({ estado: v === "todos" ? "" : v });

  const hrefOrden = (campo: Orden) =>
    url({
      orden: campo,
      dir:
        orden === campo
          ? dir === "asc"
            ? "desc"
            : "asc"
          : campo === "actividad" || campo === "estado"
            ? "desc"
            : "asc",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Operación</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Candidatos</h1>
          <p className="mt-1 max-w-prose text-sm text-ink-soft">
            Supervisión en tiempo real de referidos captados por bots enlazados a UPS.
          </p>
        </div>
      </div>

      {sinBots && (
        <Aviso tono="warn" titulo="Todavía no tenés bots asignados">
          Por eso no ves candidatos. Pedile a un administrador que te asigne al menos uno.
        </Aviso>
      )}

      <Barra metrics={metrics} cola={cola} />

      <div className="flex flex-col gap-3">
        <Buscador q={q} bot={bot} estado={filtro} tenants={tenants} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-1">
            {FILTROS.map((f) => {
              const activo = filtro === f.value;
              return (
                <Link
                  key={f.value}
                  href={cola(f.value)}
                  aria-current={activo ? "true" : undefined}
                  className={`inline-flex min-h-9 items-center rounded-control border px-3 py-1.5 text-sm transition-colors duration-150 ${
                    activo
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong hover:bg-sunk hover:text-ink"
                  }`}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>
          <p aria-live="polite" className="text-xs tabular-nums text-ink-faint">
            {ordenados.length} {ordenados.length === 1 ? "resultado" : "resultados"}
            {ordenados.length === 50 && " · tope"}
          </p>
        </div>

        <Tabla candidatos={ordenados} verDueno={verDueno} orden={orden} dir={dir} href={hrefOrden} />
      </div>
    </div>
  );
}
