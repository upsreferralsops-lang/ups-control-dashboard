import type { ReferralStatus } from "./api";

/**
 * Presentacion de cada estado de negocio. El color es semaforo (que tan bien
 * va ese candidato), nunca decoracion.
 */
export const REFERRAL_STATUS = {
  sent_confirmed: {
    label: "Referido",
    help: "El referido se envió y quedó confirmado en UPS.",
    dot: "bg-ok",
    text: "text-ok",
    wash: "bg-ok-wash",
  },
  waiting_position: {
    label: "En espera",
    help: "Quiso aplicar pero no había posiciones del programa en su estado.",
    dot: "bg-warn",
    text: "text-warn",
    wash: "bg-warn-wash",
  },
  duplicate_or_error: {
    label: "Falló",
    help: "El referido no se pudo completar: duplicado o error en el formulario.",
    dot: "bg-bad",
    text: "text-bad",
    wash: "bg-bad-wash",
  },
  not_started: {
    label: "Sin referir",
    help: "Todavía no llegó al punto de referirse.",
    dot: "bg-ink-faint",
    text: "text-ink-soft",
    wash: "bg-sunk",
  },
} as const satisfies Record<
  ReferralStatus,
  { label: string; help: string; dot: string; text: string; wash: string }
>;

export function statusOf(status: string) {
  return REFERRAL_STATUS[status as ReferralStatus] ?? REFERRAL_STATUS.not_started;
}

export function fullName(c: { first_name: string | null; last_name: string | null }) {
  return [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Sin nombre";
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
