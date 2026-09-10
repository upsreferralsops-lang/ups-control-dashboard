import type { ReferralStatus } from "./api";

/**
 * Como se muestra cada estado de negocio. El color es semantico (que tan
 * bien va ese candidato), no decorativo.
 */
export const REFERRAL_STATUS = {
  sent_confirmed: {
    label: "Referido",
    help: "El referido se envio y quedo confirmado.",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  waiting_position: {
    label: "En espera",
    help: "Quiso aplicar pero no habia posiciones del programa en su estado.",
    chip: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  duplicate_or_error: {
    label: "Fallo",
    help: "El referido no se pudo completar (duplicado o error).",
    chip: "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-400/20",
    dot: "bg-rose-500",
  },
  not_started: {
    label: "Sin referir",
    help: "Todavia no llego al punto de referirse.",
    chip: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-300 dark:ring-slate-400/20",
    dot: "bg-slate-400",
  },
} as const satisfies Record<
  ReferralStatus,
  { label: string; help: string; chip: string; dot: string }
>;

export function statusOf(status: string) {
  return (
    REFERRAL_STATUS[status as ReferralStatus] ?? REFERRAL_STATUS.not_started
  );
}

export function fullName(c: { first_name: string | null; last_name: string | null }) {
  const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim();
  return name || "Sin nombre todavia";
}

/** Fechas relativas cortas: en un panel operativo importa "hace cuanto". */
export function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "recien";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} dias`;
}
