import Link from "next/link";
import type { Candidate } from "@/lib/api";
import { IconoVolver } from "@/lib/icons";
import { fullName, presentacionReferido } from "@/lib/status";
import { Aviso, Estado, Etiqueta } from "@/components/ui";
import { CandidatoSubnav } from "./CandidatoSubnav";
import { ControlBot } from "./ControlBot";
import { MOSTRAR_CANAL } from "@/lib/canales";

export function CandidatoEncabezado({
  candidateId,
  candidate,
}: {
  candidateId: string;
  candidate: Candidate & Record<string, unknown>;
}) {
  const estado = presentacionReferido(candidate);
  const pausado = Boolean(candidate.bot_paused);
  const motivoEscalada = candidate.human_escalation_reason ?? null;
  // Rechazado: 90 días sin poder aplicar (misma regla que app/logic.py del core).
  const puedeVolverDesde =
    candidate.referral_status === "rejected" && candidate.rejected_at
      ? new Date(new Date(candidate.rejected_at).getTime() + 90 * 86_400_000).toLocaleDateString("es", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

  // Dos bloques hermanos (no uno): la barra fija del celular tiene que ser
  // hija del contenedor de toda la pagina, o se suelta al terminar el encabezado.
  return (
    <>
      <div className="shrink-0">
        <Link
          href="/candidatos"
          className="inline-flex items-center gap-1.5 rounded-control text-sm text-ink-soft transition-colors duration-150 hover:text-ink"
        >
          <IconoVolver className="h-3.5 w-3.5" />
          Candidatos
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{fullName(candidate)}</h1>
          <Estado status={candidate.referral_status} candidate={candidate} className="text-sm" />
          {MOSTRAR_CANAL && <Etiqueta>{candidate.channel}</Etiqueta>}
          {candidate.tenant_name && <Etiqueta>{candidate.tenant_name}</Etiqueta>}
        </div>
        <p className="mt-1.5 max-w-prose text-sm text-ink-soft">{estado.help}</p>
        {puedeVolverDesde && (
          <p className="mt-1 text-sm font-medium text-bad-ink">
            Puede volver a aplicar desde el {puedeVolverDesde}.
          </p>
        )}
        {pausado && motivoEscalada && (
          <div className="mt-3">
            <Aviso tono="warn" titulo="El bot pidió que lo atienda una persona">
              {motivoEscalada}
            </Aviso>
          </div>
        )}
      </div>

      {/* Celular: el bot y las pestañas quedan fijos arriba (como en el asistente),
          sin tener que volver a subir por todo el chat para cambiar de sección. */}
      <div className="shrink-0 max-md:sticky max-md:top-14 max-md:z-20 max-md:-mx-5 max-md:-mt-2 max-md:border-b max-md:border-line max-md:bg-paper max-md:px-5 max-md:py-2 sm:max-md:-mx-8 sm:max-md:px-8">
        <ControlBot candidateId={candidateId} pausado={pausado} />
        <CandidatoSubnav candidateId={candidateId} />
        {/* La pestaña Conversación pone aca la lupa y «Marcar corrección» (portal). */}
        <div id="barra-chat" className="md:hidden" />
      </div>
    </>
  );
}
