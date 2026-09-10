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
import { fullName, statusOf, timeAgo } from "@/lib/status";

export const dynamic = "force-dynamic";

const FILTROS: { value: ReferralStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sent_confirmed", label: "Referidos" },
  { value: "waiting_position", label: "En espera" },
  { value: "duplicate_or_error", label: "Fallidos" },
  { value: "not_started", label: "Sin referir" },
];

function AvisoCore({ mensaje }: { mensaje: string }) {
  return (
    <div className="border-l-2 border-bad bg-bad-wash px-4 py-3">
      <p className="text-sm font-medium">No se pudo leer el core</p>
      <p className="mt-1 text-sm text-ink-soft">{mensaje}</p>
      <p className="mt-2 font-mono text-xs text-ink-faint">
        venv/Scripts/python.exe -m uvicorn app.api.main:app --port 8080
      </p>
    </div>
  );
}

/** Barra de estado: los cinco numeros en una linea, con el total destacado. */
function Barra({ metrics }: { metrics: Metrics }) {
  const celdas = [
    { label: "Referidos", value: metrics.referidos_ok, dot: "bg-ok" },
    { label: "En espera", value: metrics.en_lista_de_espera, dot: "bg-warn" },
    { label: "Fallidos", value: metrics.referidos_fallidos, dot: "bg-bad" },
    { label: "Abandonados", value: metrics.abandonados, dot: "bg-ink-faint" },
    { label: "Aplicando", value: metrics.en_aplicacion, dot: "bg-info" },
  ];

  return (
    <div className="flex flex-col gap-6 border border-line bg-surface px-6 py-5 sm:flex-row sm:items-end">
      <div className="sm:pr-8">
        <p className="eyebrow">Candidatos</p>
        <p className="mt-1 font-mono text-4xl font-semibold leading-none tabular-nums">
          {metrics.total}
        </p>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 border-line sm:grid-cols-5 sm:border-l sm:pl-8">
        {celdas.map((c) => (
          <div key={c.label}>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
              <span className="text-xs text-ink-soft">{c.label}</span>
            </div>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tabla({ candidatos }: { candidatos: Candidate[] }) {
  if (candidatos.length === 0) {
    return (
      <div className="border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
        <p className="text-sm text-ink-soft">No hay candidatos con ese estado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-line bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            {["Candidato", "Contacto", "Zona", "Posición elegida", "Estado", "Últ. mensaje"].map(
              (h) => (
                <th key={h} className="px-4 py-2.5 text-left">
                  <span className="eyebrow">{h}</span>
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {candidatos.map((c) => {
            const estado = statusOf(c.referral_status);
            return (
              <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-sunk/60">
                <td className="px-4 py-3">
                  <Link
                    href={`/candidatos/${c.id}`}
                    className="font-medium decoration-signal underline-offset-4 hover:underline"
                  >
                    {fullName(c)}
                  </Link>
                  {c.sensitive_data_received && (
                    <span className="ml-2 bg-warn-wash px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-warn">
                      dato sensible
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  <div className="max-w-52 truncate">{c.email ?? "—"}</div>
                  <div className="font-mono text-xs text-ink-faint">{c.phone ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {c.city ?? "—"}
                  {c.zip && <span className="ml-1.5 font-mono text-xs text-ink-faint">{c.zip}</span>}
                </td>
                <td className="max-w-56 px-4 py-3 text-ink-soft">
                  <span className="line-clamp-2">{c.matched_warehouse_name ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
                    <span className={estado.text}>{estado.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                  {timeAgo(c.last_candidate_message_at ?? c.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function Panel({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { tenants, user } = await requireSession();
  const { estado } = await searchParams;
  const filtro = (estado ?? "todos") as ReferralStatus | "todos";

  let metrics: Metrics;
  let candidatos: Candidate[];
  try {
    [metrics, candidatos] = await Promise.all([
      getMetrics(),
      listCandidates(filtro === "todos" ? undefined : filtro),
    ]);
  } catch (error) {
    return (
      <AvisoCore
        mensaje={error instanceof CoreApiError ? error.message : "Error inesperado."}
      />
    );
  }

  const sinBots = user.role === "client" && tenants.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Operación</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Candidatos</h1>
        </div>
        {tenants.length > 0 && (
          <p className="text-sm text-ink-soft">
            {user.role === "admin" ? "Viendo todos los bots" : "Tus bots"}:{" "}
            <span className="font-medium text-ink">{tenants.map((t) => t.name).join(", ")}</span>
          </p>
        )}
      </div>

      {sinBots && (
        <div className="border-l-2 border-warn bg-warn-wash px-4 py-3">
          <p className="text-sm font-medium">Todavía no tenés bots asignados</p>
          <p className="mt-1 text-sm text-ink-soft">
            Por eso no ves candidatos. Pedile a un administrador que te asigne al menos uno.
          </p>
        </div>
      )}

      <Barra metrics={metrics} />

      <div className="flex flex-col gap-3">
        <nav className="flex flex-wrap gap-1">
          {FILTROS.map((f) => {
            const activo = filtro === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "todos" ? "/" : `/?estado=${f.value}`}
                className={`border px-3 py-1.5 text-sm transition-colors ${
                  activo
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <Tabla candidatos={candidatos} />
      </div>
    </div>
  );
}
