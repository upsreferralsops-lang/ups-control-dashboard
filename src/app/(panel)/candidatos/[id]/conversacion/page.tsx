import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CoreApiError, getNotifications } from "@/lib/api";
import { MarcarLeidasAlVer } from "./MarcarLeidasAlVer";
import { canalesConversacion, loadCandidatoDetalle } from "@/lib/candidato-detalle";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { ConversacionPanel } from "../ConversacionPanel";
import { SelectorCanalConversacion } from "./SelectorCanalConversacion";
import { esCanalActivo } from "@/lib/canales";

export const dynamic = "force-dynamic";

function canalValido(raw: string | undefined): "telegram" | "whatsapp" | undefined {
  return raw && esCanalActivo(raw) ? raw : undefined;
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
  // Con WhatsApp deshabilitado, cualquier conversacion se mira por Telegram.
  const preferido = detalle.conversation_channel ?? canalQuery ?? c.channel;
  const canalActivo = esCanalActivo(preferido) ? preferido : "telegram";

  if (!canalQuery) {
    const qs = new URLSearchParams();
    qs.set("canal", canalActivo);
    if (sp.mensaje) qs.set("mensaje", sp.mensaje);
    redirect(`/candidatos/${id}/conversacion?${qs.toString()}`);
  }

  const tenantName = c.tenant_name || "este cliente";
  // Los avisos de este candidato que el usuario todavia no leyo. La campana
  // ya los pidio en este mismo request (getNotifications esta cacheado).
  const avisos = await getNotifications().catch(() => null);
  const sinLeer = (avisos?.items ?? [])
    .filter((n) => n.unread && n.data?.candidate_id === id)
    .map((n) => n.id);
  const canales = canalesConversacion(detalle).filter((v) => esCanalActivo(v.channel));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      {sinLeer.length > 0 ? <MarcarLeidasAlVer ids={sinLeer} /> : null}
      {c.sensitive_data_received ? (
        <div className="shrink-0">
          <Aviso tono="warn" titulo="Envió datos sensibles por chat">
            El sistema los quitó antes de guardarlos y le pidió que borre el mensaje.
          </Aviso>
        </div>
      ) : null}

      {/* Con un solo canal activo no hay nada que elegir. */}
      {canales.length > 1 ? (
        <Suspense
          fallback={
            <div className="grid shrink-0 grid-cols-2 gap-3">
              <div className="latido h-[4.5rem] rounded-panel bg-sunk" />
              <div className="latido h-[4.5rem] rounded-panel bg-sunk" />
            </div>
          }
        >
          <SelectorCanalConversacion candidateId={id} canales={canales} canalActivo={canalActivo} />
        </Suspense>
      ) : null}

      <ConversacionPanel
        conversation={conversation}
        candidateId={id}
        tenantName={tenantName}
        focusMessageId={focusMessageId}
        canal={canalActivo}
        canalLabel={canalActivo === "whatsapp" ? "WhatsApp" : "Telegram"}
        botPausado={Boolean(c.bot_paused)}
        // Se escribe por el canal del propio candidato; un hilo vinculado
        // (mismo correo en otro canal) es otro registro y se mira, no se escribe.
        puedeEscribir={canalActivo === (c.channel || "telegram")}
      />
    </div>
  );
}
