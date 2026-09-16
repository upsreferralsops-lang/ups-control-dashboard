import { notFound } from "next/navigation";
import { CoreApiError } from "@/lib/api";
import { loadCandidatoDetalle } from "@/lib/candidato-detalle";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { CandidatoEncabezado } from "./CandidatoEncabezado";

export default async function CandidatoDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;

  try {
    const { candidate } = await loadCandidatoDetalle(id);
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <CandidatoEncabezado candidateId={id} candidate={candidate} />
        {children}
      </div>
    );
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <Aviso tono="bad">
        {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
      </Aviso>
    );
  }
}
