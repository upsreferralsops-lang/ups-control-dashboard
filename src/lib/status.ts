import type { ComponentType } from "react";
import type { ReferralStatus } from "./api";
import {
  IconoAlerta,
  IconoError,
  IconoNeutro,
  IconoOk,
  IconoReloj,
} from "./icons";

/**
 * Presentacion de cada estado de negocio. Color + icono + texto: nunca solo
 * el color.
 */
export const REFERRAL_STATUS = {
  sent_confirmed: {
    label: "Referido",
    help: "El referido se envió y quedó confirmado en UPS.",
    badge: "border-ok-border bg-ok-wash text-ok-ink",
    Icono: IconoOk,
  },
  waiting_position: {
    label: "En espera",
    help: "Quiso aplicar pero no había posiciones del programa en su estado.",
    badge: "border-warn-border bg-warn-wash text-warn-ink",
    Icono: IconoReloj,
  },
  duplicate_or_error: {
    label: "Falló",
    help: "El referido no se pudo completar: duplicado o error en el formulario.",
    badge: "border-attention-border bg-attention-wash text-attention-ink",
    Icono: IconoError,
  },
  not_started: {
    label: "Sin referir",
    help: "Todavía no llegó al punto de referirse.",
    badge: "border-info-border bg-info-wash text-info-ink",
    Icono: IconoNeutro,
  },
  search_failed: {
    label: "Búsqueda falló",
    help: "No se pudo consultar las vacantes de UPS, así que no sabemos si hay cupos. Revisá la sesión de UPS y reintentá.",
    badge: "border-bad-border bg-bad-wash text-bad-ink",
    Icono: IconoAlerta,
  },
} as const satisfies Record<
  ReferralStatus,
  {
    label: string;
    help: string;
    badge: string;
    Icono: ComponentType<{ className?: string }>;
  }
>;

export type PresentacionEstado = {
  label: string;
  help: string;
  badge: string;
  Icono: ComponentType<{ className?: string }>;
};

/** Misma ventana que GET /api/metrics (`inactive_days`, default 3). */
export const DIAS_INACTIVIDAD_ABANDONO = 3;

const ABANDONADO: PresentacionEstado = {
  label: "Abandonado",
  help: "No completó el referido y dejó de escribir hace varios días.",
  badge: "border-line bg-sunk text-ink-soft",
  Icono: IconoNeutro,
};

export function esCandidatoAbandonado(
  c: {
    referral_status: string;
    last_candidate_message_at: string | null;
    created_at: string;
  },
  inactiveDays = DIAS_INACTIVIDAD_ABANDONO,
): boolean {
  if (c.referral_status !== "not_started") return false;
  const ref = c.last_candidate_message_at ?? c.created_at;
  const limite = inactiveDays * 86_400_000;
  return Date.now() - new Date(ref).getTime() >= limite;
}

/** Etiqueta visible: alinea tabla/detalle con la métrica «Abandonados». */
export function presentacionReferido(
  c: {
    referral_status: string;
    last_candidate_message_at: string | null;
    created_at: string;
  },
  inactiveDays = DIAS_INACTIVIDAD_ABANDONO,
): PresentacionEstado {
  if (esCandidatoAbandonado(c, inactiveDays)) return ABANDONADO;
  return statusOf(c.referral_status);
}

export function statusOf(status: string) {
  return REFERRAL_STATUS[status as ReferralStatus] ?? REFERRAL_STATUS.not_started;
}

export function fullName(c: { first_name: string | null; last_name: string | null }) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Sin nombre";
}

const STATUS_INTERNO: Record<string, string> = {
  collecting_data: "Recopilando datos",
  ready_to_refer: "Listo para referir",
  referred: "Referido enviado",
  referral_failed: "Referido falló",
  applying: "En aplicación",
  done: "Cerrado",
};

export function etiquetaStatusInterno(status: string) {
  return STATUS_INTERNO[status] ?? status;
}

const APPLICATION_STATUS: Record<string, string> = {
  not_started: "Sin iniciar",
  link_sent: "Enlace enviado",
  in_progress: "En progreso",
  documents_review: "Revisión de documentos",
  orientation: "Orientación",
  hired: "Contratado",
  closed: "Cerrado",
  needs_human: "Requiere humano",
};

export function etiquetaApplicationStatus(status: string) {
  return APPLICATION_STATUS[status] ?? status;
}

/** En un panel operativo importa "hace cuánto", no la fecha exacta. */
export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `${dias} días`;
}
