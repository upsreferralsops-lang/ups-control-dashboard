import type { ApplicationHistoryEntry } from "@/lib/api";
import {
  etiquetaTipoHistorial,
  formatFechaHistorial,
  resumenFila,
} from "@/lib/historial-aplicaciones";
import { Etiqueta } from "@/components/ui";

function Enlaces({ entry }: { entry: ApplicationHistoryEntry }) {
  if (entry.kind === "referral_attempt" && entry.url) {
    return (
      <a
        href={entry.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-ink-soft decoration-signal decoration-2 underline-offset-4 hover:text-ink hover:underline"
      >
        Posting
      </a>
    );
  }
  if (entry.kind === "application_tracking") {
    return (
      <span className="flex flex-wrap gap-x-3 gap-y-1">
        {entry.matched_job_url ? (
          <a
            href={entry.matched_job_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-soft decoration-signal decoration-2 underline-offset-4 hover:text-ink hover:underline"
          >
            Trabajo
          </a>
        ) : null}
        {entry.fountain_personal_url ? (
          <a
            href={entry.fountain_personal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-soft decoration-signal decoration-2 underline-offset-4 hover:text-ink hover:underline"
          >
            Fountain
          </a>
        ) : null}
        {!entry.matched_job_url && !entry.fountain_personal_url ? (
          <span className="text-ink-faint">—</span>
        ) : null}
      </span>
    );
  }
  return <span className="text-ink-faint">—</span>;
}

function fechaFila(entry: ApplicationHistoryEntry): string {
  if (entry.occurred_at) return formatFechaHistorial(entry.occurred_at);
  if (entry.kind === "referral_attempt" && entry.submitted_at) {
    return formatFechaHistorial(entry.submitted_at);
  }
  return "—";
}

export function HistorialLista({ entries }: { entries: ApplicationHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-panel border border-dashed border-line-strong bg-surface px-6 py-16 text-center">
        <p className="text-sm font-medium">Sin aplicaciones registradas</p>
        <p className="mt-1 text-sm text-ink-soft">
          Solo aparecen postulaciones donde se ejecutó el workflow de referido (con éxito o con
          error).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-panel border border-line bg-surface">
      <table className="tabla-pegajosa w-full text-sm">
        <thead>
          <tr>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Fecha</span>
            </th>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Tipo</span>
            </th>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Detalle</span>
            </th>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Info</span>
            </th>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Estado</span>
            </th>
            <th className="px-3 py-2.5 text-left">
              <span className="eyebrow">Enlaces</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const { titulo, subtitulo, estado } = resumenFila(entry);
            const tipo = etiquetaTipoHistorial(entry);
            const key =
              entry.kind === "referral_attempt"
                ? `ref-${entry.submitted_at ?? i}-${entry.success}`
                : `track-${i}`;

            return (
              <tr
                key={key}
                className="border-t border-line/60 transition-colors duration-100 hover:bg-sunk/60"
              >
                <td className="whitespace-nowrap px-3 py-2.5 text-xs tabular-nums text-ink-faint">
                  {fechaFila(entry)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  <Etiqueta>{tipo}</Etiqueta>
                </td>
                <td className="max-w-xs px-3 py-2.5">
                  <div className="font-medium text-ink">{titulo}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{subtitulo}</div>
                </td>
                <td className="max-w-sm px-3 py-2.5 text-ink-soft">
                  {entry.kind === "referral_attempt" && entry.posting_id ? (
                    <span className="text-xs tabular-nums text-ink-faint">ID {entry.posting_id}</span>
                  ) : null}
                  {entry.kind === "referral_attempt" && entry.error ? (
                    <span className="line-clamp-3 text-xs">{entry.error}</span>
                  ) : null}
                  {entry.kind === "application_tracking" ? (
                    <span className="text-xs">{subtitulo}</span>
                  ) : null}
                  {entry.kind === "referral_attempt" && !entry.posting_id && !entry.error ? (
                    <span className="text-ink-faint">—</span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {estado ? (
                    <span
                      className={
                        estado === "Completado"
                          ? "text-ok-ink"
                          : estado === "Falló"
                            ? "text-attention-ink"
                            : "text-ink-soft"
                      }
                    >
                      {estado}
                    </span>
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <Enlaces entry={entry} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
