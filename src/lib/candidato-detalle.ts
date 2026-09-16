import { cache } from "react";
import type { CandidateDetail } from "./api";
import { getCandidate } from "./api";

type Canal = "telegram" | "whatsapp" | undefined;

/** Una sola petición por request entre layout y páginas del detalle. */
export const loadCandidatoDetalle = cache((id: string, channel?: Canal) =>
  getCandidate(id, channel),
);

export function canalesConversacion(detalle: CandidateDetail) {
  const fallback = (detalle.candidate.channel === "whatsapp" ? "whatsapp" : "telegram") as
    | "telegram"
    | "whatsapp";
  const views = detalle.conversation_channels;
  if (views?.length) return views;
  return [
    {
      channel: "telegram" as const,
      candidate_id: fallback === "telegram" ? detalle.candidate.id : null,
      message_count: fallback === "telegram" ? detalle.conversation.length : 0,
      linked_record: false,
    },
    {
      channel: "whatsapp" as const,
      candidate_id: fallback === "whatsapp" ? detalle.candidate.id : null,
      message_count: fallback === "whatsapp" ? detalle.conversation.length : 0,
      linked_record: false,
    },
  ];
}
