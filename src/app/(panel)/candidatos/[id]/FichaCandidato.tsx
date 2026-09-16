import type { Candidate } from "@/lib/api";
import { etiquetaApplicationStatus, etiquetaStatusInterno, presentacionReferido } from "@/lib/status";
import { Bloque } from "@/components/ui";

function Dato({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow">{label}</dt>
      <dd className={`mt-1 break-words text-sm ${mono ? "tabular-nums text-xs" : ""}`}>
        {value || <span className="text-ink-faint">—</span>}
      </dd>
    </div>
  );
}

function fmtFecha(iso: string | null | undefined) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function FichaCandidato({ c }: { c: Candidate & Record<string, unknown> }) {
  const estadoReferido = presentacionReferido(c);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <Bloque titulo="Contacto" className="lg:col-span-4">
        <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="sm:col-span-2 lg:col-span-1">
            <Dato label="Correo" value={c.email} />
          </div>
          <Dato label="Teléfono" value={c.phone} mono />
          <Dato label="ZIP" value={c.zip} mono />
          <Dato label="Ciudad" value={c.city} />
          <Dato label="Estado (US)" value={c.home_state} />
          <Dato label="Rol deseado" value={c.desired_role as string | null} />
        </dl>
      </Bloque>

      <Bloque titulo="Proceso" className="lg:col-span-8">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
          <Dato label="Estado referido" value={estadoReferido.label} />
          <Dato label="Estado interno" value={etiquetaStatusInterno(c.status)} mono />
          <Dato
            label="Aplicación"
            value={etiquetaApplicationStatus(c.application_status)}
            mono
          />
          <Dato
            label="Último mensaje del candidato"
            value={fmtFecha(c.last_candidate_message_at)}
          />
          <Dato label="Alta en sistema" value={fmtFecha(c.created_at)} />
          <div className="col-span-2 sm:col-span-3">
            <Dato
              label="Verificaciones"
              value={[
                c.email_verified_by_candidate ? "Correo OK" : null,
                c.ssd_requirements_confirmed ? "SSD OK" : null,
                c.role_selection_confirmed ? "Rol OK" : null,
                c.consent_to_referral ? "Consentimiento" : null,
              ]
                .filter(Boolean)
                .join(" · ") || undefined}
            />
          </div>
        </dl>
      </Bloque>
    </div>
  );
}
