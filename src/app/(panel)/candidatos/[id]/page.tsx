import { notFound, redirect } from "next/navigation";
import { CoreApiError, listImprovementCases, type ImprovementCase } from "@/lib/api";
import { loadCandidatoDetalle } from "@/lib/candidato-detalle";
import { metricsConFallback } from "@/lib/candidato-metrics";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { FichaCandidato } from "./FichaCandidato";
import { MetricasCandidato } from "./MetricasCandidato";
import { ReglasMejora } from "./ReglasMejora";

export const dynamic = "force-dynamic";

export default async function CandidatoResumenPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mensaje?: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const { mensaje } = await searchParams;
  if (mensaje) {
    redirect(`/candidatos/${id}/conversacion?mensaje=${encodeURIComponent(mensaje)}`);
  }

  let detalle;
  try {
    detalle = await loadCandidatoDetalle(id);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <Aviso tono="bad">
        {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
      </Aviso>
    );
  }

  const { candidate: c, metrics: metricsRaw } = detalle;
  const metrics = metricsConFallback(metricsRaw, c);
  const tenantName = c.tenant_name || "este cliente";

  let casos: ImprovementCase[] = [];
  try {
    casos = await listImprovementCases(id);
  } catch {
    casos = [];
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      {c.sensitive_data_received ? (
        <Aviso tono="warn" titulo="Envió datos sensibles por chat">
          El sistema los quitó antes de guardarlos y le pidió que borre el mensaje. El valor real
          nunca quedó registrado.
        </Aviso>
      ) : null}

      <MetricasCandidato metrics={metrics} />

      <FichaCandidato c={c} />

      <ReglasMejora candidateId={id} tenantName={tenantName} casos={casos} />
    </div>
  );
}
