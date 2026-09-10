import Link from "next/link";
import {
  CoreApiError,
  getMetrics,
  listCandidates,
  type Candidate,
  type Metrics,
  type ReferralStatus,
} from "@/lib/api";
import { fullName, statusOf, timeAgo } from "@/lib/status";

export const dynamic = "force-dynamic";

const FILTROS: { value: ReferralStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sent_confirmed", label: "Referidos" },
  { value: "waiting_position", label: "En espera" },
  { value: "duplicate_or_error", label: "Fallidos" },
  { value: "not_started", label: "Sin referir" },
];

function ErrorCore({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/30">
      <h2 className="text-sm font-semibold text-rose-800 dark:text-rose-300">
        No se pudo leer el core
      </h2>
      <p className="mt-1 max-w-prose text-sm text-rose-700 dark:text-rose-400">{message}</p>
      <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-rose-600 dark:text-rose-400/80">
        venv/Scripts/python.exe -m uvicorn app.api.main:app --port 8080
      </p>
    </div>
  );
}

function Tile({
  label,
  value,
  help,
  accent,
}: {
  label: string;
  value: number;
  help: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${accent}`} />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      </div>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-3xl font-semibold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-500">{help}</p>
    </div>
  );
}

function TablaCandidatos({ candidatos }: { candidatos: Candidate[] }) {
  if (candidatos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Todavia no hay candidatos con ese estado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-800">
            {["Candidato", "Contacto", "Zona", "Posicion elegida", "Estado", "Ultimo mensaje"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {candidatos.map((c) => {
            const estado = statusOf(c.referral_status);
            return (
              <tr
                key={c.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/candidatos/${c.id}`}
                    className="font-medium text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
                  >
                    {fullName(c)}
                  </Link>
                  {c.sensitive_data_received && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                      mando datos sensibles
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  <div className="truncate">{c.email ?? "—"}</div>
                  <div className="font-[family-name:var(--font-mono)] text-xs">
                    {c.phone ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                  {c.city ?? "—"}
                  <span className="ml-1 font-[family-name:var(--font-mono)] text-xs text-slate-500">
                    {c.zip ?? ""}
                  </span>
                </td>
                <td className="max-w-56 px-4 py-3 text-slate-600 dark:text-slate-400">
                  <span className="line-clamp-2">{c.matched_warehouse_name ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${estado.chip}`}
                  >
                    {estado.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
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
      <ErrorCore
        message={
          error instanceof CoreApiError ? error.message : "Error inesperado leyendo el core."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Resumen</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {metrics.total} candidato{metrics.total === 1 ? "" : "s"} en total.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Tile
          label="Referidos"
          value={metrics.referidos_ok}
          help="Confirmados en UPS"
          accent="bg-emerald-500"
        />
        <Tile
          label="En espera"
          value={metrics.en_lista_de_espera}
          help="Sin posiciones en su zona"
          accent="bg-amber-500"
        />
        <Tile
          label="Fallidos"
          value={metrics.referidos_fallidos}
          help="Duplicado o error al referir"
          accent="bg-rose-500"
        />
        <Tile
          label="Abandonados"
          value={metrics.abandonados}
          help="Hablaron y no continuaron"
          accent="bg-slate-400"
        />
        <Tile
          label="Aplicando"
          value={metrics.en_aplicacion}
          help="Ya en el proceso de UPS"
          accent="bg-sky-500"
        />
      </div>

      <div className="flex flex-col gap-3">
        <nav className="flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const activo = filtro === f.value;
            return (
              <Link
                key={f.value}
                href={f.value === "todos" ? "/" : `/?estado=${f.value}`}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-800 dark:hover:bg-slate-800"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </nav>
        <TablaCandidatos candidatos={candidatos} />
      </div>
    </div>
  );
}
