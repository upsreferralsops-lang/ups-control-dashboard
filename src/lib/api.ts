/**
 * Cliente del core (FastAPI). Solo se usa desde el servidor: la API key
 * nunca viaja al browser, por eso no hay NEXT_PUBLIC_ en las variables.
 */

const BASE_URL = process.env.CORE_API_URL ?? "http://localhost:8080";
const API_KEY = process.env.CORE_API_KEY ?? "";

/** Estados de negocio del playbook (apendice A). */
export type ReferralStatus =
  | "not_started"
  | "waiting_position"
  | "sent_confirmed"
  | "duplicate_or_error";

export type Metrics = {
  referidos_ok: number;
  referidos_fallidos: number;
  en_lista_de_espera: number;
  abandonados: number;
  en_aplicacion: number;
  total: number;
  con_datos_sensibles: number;
};

export type Candidate = {
  id: string;
  channel: string;
  telegram_chat_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  home_state: string | null;
  zip: string | null;
  desired_role: string | null;
  status: string;
  referral_status: ReferralStatus;
  application_status: string;
  matched_warehouse_name: string | null;
  referral_confirmed_at: string | null;
  sensitive_data_received: boolean;
  last_candidate_message_at: string | null;
  created_at: string;
};

export type Message = {
  direction: "in" | "out";
  text: string;
  created_at: string;
};

export type CandidateDetail = {
  candidate: Candidate & Record<string, unknown>;
  conversation: Message[];
};

/** Se distingue del Error comun para poder mostrar el core caido sin romper la pagina. */
export class CoreApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CoreApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { "x-api-key": API_KEY, ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new CoreApiError(
      `No se pudo conectar con el core en ${BASE_URL}. Verifica que este corriendo.`,
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new CoreApiError(
      response.status === 401
        ? "La API key del dashboard no coincide con la del core."
        : `El core respondio ${response.status}. ${detail.slice(0, 200)}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function getMetrics(inactiveDays = 3) {
  return request<Metrics>(`/api/metrics?inactive_days=${inactiveDays}`);
}

export function listCandidates(referralStatus?: ReferralStatus, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (referralStatus) params.set("referral_status", referralStatus);
  return request<Candidate[]>(`/api/candidates?${params}`);
}

export function getCandidate(id: string) {
  return request<CandidateDetail>(`/api/candidates/${id}`);
}

export function confirmReferral(id: string) {
  return request<Candidate>(`/api/candidates/${id}/confirm-referral`, {
    method: "POST",
  });
}
