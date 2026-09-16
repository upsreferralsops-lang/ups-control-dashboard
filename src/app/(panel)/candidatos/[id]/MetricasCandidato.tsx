import type { CandidateDetailMetrics, LastPosition } from "@/lib/api";
import { Bloque } from "@/components/ui";

function Metrica({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-control border border-line bg-sunk px-3 py-2.5">
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight sm:text-xl">{value}</p>
    </div>
  );
}

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}

function UltimaPosicion({ pos }: { pos: LastPosition | null }) {
  if (!pos?.title) {
    return (
      <div className="rounded-control border border-dashed border-line-strong bg-sunk/50 px-4 py-3">
        <p className="eyebrow">Última posición postulada</p>
        <p className="mt-1 text-sm text-ink-soft">Todavía no hay una postulación registrada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-control border border-line bg-sunk px-4 py-3">
      <p className="eyebrow">Última posición postulada</p>
      <p className="mt-1 text-base font-semibold leading-snug text-ink">{pos.title}</p>
      {pos.location ? (
        <p className="mt-0.5 text-sm text-ink-soft">{pos.location}</p>
      ) : null}
      {pos.url ? (
        <a
          href={pos.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-accent hover:underline"
        >
          Ver posting
        </a>
      ) : null}
    </div>
  );
}

export function MetricasCandidato({ metrics }: { metrics: CandidateDetailMetrics }) {
  return (
    <Bloque titulo="Actividad">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica label="Mensajes" value={metrics.messages_total} />
        <Metrica label="Del candidato" value={metrics.messages_from_candidate} />
        <Metrica label="Del bot" value={metrics.messages_from_bot} />
        <Metrica label="Vacantes mostradas" value={metrics.job_options_count} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <UltimaPosicion pos={metrics.last_position ?? null} />
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="eyebrow">Primer mensaje</dt>
            <dd className="mt-1 tabular-nums">{fmtFecha(metrics.first_message_at)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Último mensaje</dt>
            <dd className="mt-1 tabular-nums">{fmtFecha(metrics.last_message_at)}</dd>
          </div>
          <div>
            <dt className="eyebrow">Consentimiento referido</dt>
            <dd className="mt-1">{metrics.consent_to_referral ? "Sí" : "No"}</dd>
          </div>
          <div>
            <dt className="eyebrow">Referido (sistema)</dt>
            <dd className="mt-1">{metrics.referral_confirmed ? "Confirmado" : "Pendiente"}</dd>
          </div>
        </dl>
      </div>
    </Bloque>
  );
}
