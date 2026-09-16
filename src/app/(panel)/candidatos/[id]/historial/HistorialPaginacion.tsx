import Link from "next/link";
import type { FiltrosHistorial } from "@/lib/historial-aplicaciones";
import { historialQueryString } from "@/lib/historial-aplicaciones";

export function HistorialPaginacion({
  candidateId,
  filtros,
  pagina,
  totalPaginas,
  total,
  desde,
  hasta,
}: {
  candidateId: string;
  filtros: FiltrosHistorial;
  pagina: number;
  totalPaginas: number;
  total: number;
  desde: number;
  hasta: number;
}) {
  const base = `/candidatos/${candidateId}/historial`;

  if (total === 0) {
    return (
      <p className="text-sm text-ink-soft">
        Ningún registro coincide con los filtros actuales.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p className="text-ink-soft">
        Mostrando{" "}
        <span className="tabular-nums text-ink">
          {desde}–{hasta}
        </span>{" "}
        de <span className="tabular-nums text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link
            href={`${base}${historialQueryString(filtros, { pagina: pagina - 1 })}`}
            className="rounded-control border border-line-strong px-3 py-1.5 text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-control border border-line px-3 py-1.5 text-ink-faint">
            Anterior
          </span>
        )}
        <span className="tabular-nums text-xs text-ink-faint">
          Página {pagina} / {totalPaginas}
        </span>
        {pagina < totalPaginas ? (
          <Link
            href={`${base}${historialQueryString(filtros, { pagina: pagina + 1 })}`}
            className="rounded-control border border-line-strong px-3 py-1.5 text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
          >
            Siguiente
          </Link>
        ) : (
          <span className="rounded-control border border-line px-3 py-1.5 text-ink-faint">
            Siguiente
          </span>
        )}
      </div>
    </div>
  );
}
