import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CoreApiError } from "@/lib/api";
import { canalesConversacion, loadCandidatoDetalle } from "@/lib/candidato-detalle";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { ConversacionPanel } from "../ConversacionPanel";
import { SelectorCanalConversacion } from "./SelectorCanalConversacion";

export const dynamic = "force-dynamic";

function canalValido(raw: string | undefined): "telegram" | "whatsapp" | undefined {
  if (raw === "telegram" || raw === "whatsapp") return raw;
  return undefined;
}

export default async function CandidatoConversacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mensaje?: string; canal?: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const canalQuery = canalValido(sp.canal);
  const rawFocus = sp.mensaje ? Number(sp.mensaje) : NaN;
  const focusMessageId = Number.isFinite(rawFocus) ? rawFocus : undefined;

  let detalle;
  try {
    detalle = await loadCandidatoDetalle(id, canalQuery);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <Aviso tono="bad">
        {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
      </Aviso>
    );
  }

  const { candidate: c, conversation } = detalle;
  const canalActivo =
    detalle.conversation_channel ??
    canalQuery ??
    (c.channel === "whatsapp" ? "whatsapp" : "telegram");

  if (!canalQuery && sp.canal === undefined) {
    const qs = new URLSearchParams();
    qs.set("canal", canalActivo);
    if (sp.mensaje) qs.set("mensaje", sp.mensaje);
    redirect(`/candidatos/${id}/conversacion?${qs.toString()}`);
  }

  const tenantName = c.tenant_name || "este cliente";
  const canales = canalesConversacion(detalle);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {c.sensitive_data_received ? (
        <div className="shrink-0">
          <Aviso tono="warn" titulo="Envió datos sensibles por chat">
            El sistema los quitó antes de guardarlos y le pidió que borre el mensaje.
          </Aviso>
        </div>
      ) : null}

      <Suspense
        fallback={
          <div className="grid shrink-0 grid-cols-2 gap-3">
            <div className="latido h-[4.5rem] rounded-panel bg-sunk" />
            <div className="latido h-[4.5rem] rounded-panel bg-sunk" />
          </div>
        }
      >
        <SelectorCanalConversacion
          candidateId={id}
          canales={canales}
          canalActivo={canalActivo}
        />
      </Suspense>

      <ConversacionPanel
        conversation={conversation}
        candidateId={id}
        tenantName={tenantName}
        focusMessageId={focusMessageId}
        canalLabel={canalActivo === "whatsapp" ? "WhatsApp" : "Telegram"}
      />
    </div>
  );
}
