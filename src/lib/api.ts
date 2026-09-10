/**
 * Cliente del core (FastAPI). Solo se usa desde el servidor: el token de
 * sesion vive en una cookie httpOnly y nunca lo toca el navegador.
 */

import { cookies } from "next/headers";

const BASE_URL = process.env.CORE_API_URL ?? "http://localhost:8080";

export const SESSION_COOKIE = "ups_session";

export type Role = "admin" | "client";

export type ReferralStatus =
  | "not_started"
  | "waiting_position"
  | "sent_confirmed"
  | "duplicate_or_error";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  channel: "telegram" | "whatsapp";
};

export type Session = { user: SessionUser; tenants: Tenant[] };

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

export type Message = { direction: "in" | "out"; text: string; created_at: string };

export type CandidateDetail = {
  candidate: Candidate & Record<string, unknown>;
  conversation: Message[];
};

export type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  active: boolean;
  last_login_at: string | null;
  tenants: Tenant[];
};

export type AdminTenant = Tenant & { bot_handle: string | null; candidatos: number };

export class CoreApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CoreApiError";
  }
}

/** 401 del core: la sesion caduco o el usuario dejo de ser valido. */
export class SessionExpiredError extends CoreApiError {}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const auth = token ?? (await cookies()).get(SESSION_COOKIE)?.value;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new CoreApiError(
      `No se pudo conectar con el core en ${BASE_URL}. Verifica que este corriendo.`,
    );
  }

  if (response.status === 401) {
    throw new SessionExpiredError("Tu sesion vencio.", 401);
  }
  if (!response.ok) {
    let detail = "";
    try {
      detail = ((await response.json()) as { detail?: string }).detail ?? "";
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new CoreApiError(detail || `El core respondio ${response.status}.`, response.status);
  }

  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<{ token: string; user: SessionUser; tenants: Tenant[] }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    "",
  );
}

export const getSession = () => request<Session>("/api/me");
export const getMetrics = (dias = 3) => request<Metrics>(`/api/metrics?inactive_days=${dias}`);

export function listCandidates(referralStatus?: ReferralStatus, limit = 50) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (referralStatus) params.set("referral_status", referralStatus);
  return request<Candidate[]>(`/api/candidates?${params}`);
}

export const getCandidate = (id: string) => request<CandidateDetail>(`/api/candidates/${id}`);

export const confirmReferral = (id: string) =>
  request<Candidate>(`/api/candidates/${id}/confirm-referral`, { method: "POST" });

// --- Administracion ---

export const listUsers = () => request<AdminUser[]>("/api/admin/users");
export const listTenants = () => request<AdminTenant[]>("/api/admin/tenants");

export const createUser = (body: {
  email: string;
  password: string;
  name?: string;
  role: Role;
}) => request<SessionUser>("/api/admin/users", { method: "POST", body: JSON.stringify(body) });

export const assignTenants = (userId: string, tenantIds: string[]) =>
  request<unknown>(`/api/admin/users/${userId}/tenants`, {
    method: "PUT",
    body: JSON.stringify({ tenant_ids: tenantIds }),
  });
