import Link from "next/link";
import type { Candidate } from "@/lib/api";
import { IconoVolver } from "@/lib/icons";
import { fullName, presentacionReferido } from "@/lib/status";
import { Estado, Etiqueta } from "@/components/ui";
import { CandidatoSubnav } from "./CandidatoSubnav";

export function CandidatoEncabezado({
  candidateId,
  candidate,
}: {
  candidateId: string;
  candidate: Candidate & Record<string, unknown>;
}) {
  const estado = presentacionReferido(candidate);

  return (
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
        <Etiqueta>{candidate.channel}</Etiqueta>
        {candidate.tenant_name && <Etiqueta>{candidate.tenant_name}</Etiqueta>}
      </div>
      <p className="mt-1.5 max-w-prose text-sm text-ink-soft">{estado.help}</p>

      <CandidatoSubnav candidateId={candidateId} />
    </div>
  );
}
