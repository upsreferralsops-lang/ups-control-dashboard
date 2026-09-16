/**
 * Cliente del core (FastAPI). Solo se usa desde el servidor: el token de
 * sesion vive en una cookie httpOnly y nunca lo toca el navegador.
 */

import { cookies } from "next/headers";

const BASE_URL = process.env.CORE_API_URL ?? "http://localhost:8090";

export const SESSION_COOKIE = "ups_session";

export type Role = "admin" | "client";

export type ReferralStatus =
  | "not_started"
  | "waiting_position"
  | "sent_confirmed"
  | "duplicate_or_error"
  | "search_failed";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

export type Impersonation = {
  admin_id: string;
  admin_email: string;
  admin_name: string | null;
};

export type TenantChannel = {
  id: string;
  channel: "telegram" | "whatsapp";
  bot_handle: string | null;
  active: boolean;
};

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  channel: "telegram" | "whatsapp";
  /**
   * El core ya manda esto en login, /api/me y /api/admin/tenants (ver
   * _public_tenant en app/api/main.py) -- faltaba en el tipo, no en la
   * respuesta. Opcional porque no todos los llamadores lo necesitan.
   */
  channels?: TenantChannel[];
  /** Candidatos que entraron por cada canal: {"whatsapp": 340, "telegram": 120}. */
  candidatos_por_canal?: Partial<Record<TenantChannel["channel"], number>>;
  created_at?: string | null;
};

export type Session = {
  user: SessionUser;
  tenants: Tenant[];
  impersonation: Impersonation | null;
};

type AuthExchange = Session & { token: string };

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
  tenant_id: string | null;
  tenant_name: string | null;
  bot_handle: string | null;
  /** Usuarios (rol client) con ese bot asignado. Vacio = sin dueno todavia. */
  owners: { id: string; name: string | null; email: string }[];
  matched_job_url?: string | null;
  matched_warehouse_id?: string | null;
  job_options?: JobOption[];
  referral_result?: Record<string, unknown> | null;
  role_selection_confirmed?: boolean;
  email_verified_by_candidate?: boolean;
  ssd_requirements_confirmed?: boolean;
  consent_to_referral?: boolean;
  fountain_personal_url?: string | null;
  updated_at?: string | null;
};

export type JobOption = {
  posting_id?: string | null;
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  url?: string | null;
};

export type LastPosition = {
  title: string | null;
  url?: string | null;
  location?: string | null;
};

export type CandidateDetailMetrics = {
  messages_total: number;
  messages_from_candidate: number;
  messages_from_bot: number;
  first_message_at: string | null;
  last_message_at: string | null;
  job_options_count: number;
  has_selected_job: boolean;
  last_position?: LastPosition | null;
  consent_to_referral: boolean;
  referral_confirmed: boolean;
};

export type ApplicationHistoryEntry =
  | {
      kind: "referral_attempt";
      success?: boolean | null;
      error?: string | null;
      submitted_at?: string | null;
      dry_run?: boolean | null;
      occurred_at?: string | null;
      title?: string | null;
      location?: string | null;
      job_type?: string | null;
      url?: string | null;
      posting_id?: string | null;
    }
  | {
      kind: "application_tracking";
      application_status: string;
      fountain_personal_url?: string | null;
      matched_job_url?: string | null;
      matched_warehouse_name?: string | null;
      occurred_at?: string | null;
    };

export type Message = {
  id: number | string;
  direction: "in" | "out";
  text: string;
  created_at: string;
};

export type ImprovementCase = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  candidate_id: string;
  message_id: number;
  message_direction: "in" | "out";
  anchor_text: string;
  guidance: string;
  active: boolean;
  created_by: string;
  created_by_email: string | null;
  created_by_name: string | null;
  created_at: string | null;
};

export type ConversationChannelView = {
  channel: "telegram" | "whatsapp";
  candidate_id: string | null;
  message_count: number;
  /** Otro registro del mismo candidato (mismo email/teléfono). */
  linked_record: boolean;
};

export type CandidateDetail = {
  candidate: Candidate & Record<string, unknown>;
  conversation: Message[];
  conversation_channel?: "telegram" | "whatsapp";
  conversation_channels?: ConversationChannelView[];
  metrics: CandidateDetailMetrics;
  application_history: ApplicationHistoryEntry[];
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

export type AdminTenant = Tenant & {
  bot_handle: string | null;
  candidatos: number;
  /** Un bot de baja deja de recibir mensajes, pero conserva su historial. */
  active: boolean;
};

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
    throw new CoreApiError(
      detail === "Not Found" && response.status === 404
        ? "El core no tiene esta funcion (reconstrui la imagen del API: docker compose -f docker-compose.cloud.yml up -d --build api)."
        : detail || `El core respondio ${response.status}.`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function login(email: string, password: string) {
  return request<AuthExchange>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    "",
  );
}

export const getSession = async (): Promise<Session> => {
  const data = await request<Session & { impersonation?: Impersonation | null }>("/api/me");
  return {
    ...data,
    impersonation: data.impersonation ?? null,
  };
};

export const impersonateUser = (userId: string) =>
  request<AuthExchange>(`/api/admin/users/${userId}/impersonate`, { method: "POST" });

export type ImpersonationTarget = {
  id: string;
  email: string;
  name: string | null;
  bot_count: number;
};

export type ImpersonationTargets = {
  admin: SessionUser;
  viewing_user_id: string | null;
  targets: ImpersonationTarget[];
};

export const listImpersonationTargets = () =>
  request<ImpersonationTargets>("/api/auth/impersonate/targets");

/** Lista para el selector del sidebar; tolera core sin /impersonate/targets. */
export async function cargarOpcionesVista(session: Session): Promise<ImpersonationTargets | null> {
  const esAdmin = session.user.role === "admin";
  if (!esAdmin && !session.impersonation) return null;

  try {
    return await listImpersonationTargets();
  } catch {
    if (session.impersonation) {
      return {
        admin: {
          id: session.impersonation.admin_id,
          email: session.impersonation.admin_email,
          name: session.impersonation.admin_name,
          role: "admin",
        },
        viewing_user_id: session.user.id,
        targets: [],
      };
    }
    if (!esAdmin) return null;
    try {
      const users = await listUsers();
      return {
        admin: session.user,
        viewing_user_id: null,
        targets: users
          .filter((u) => u.role === "client" && u.active)
          .map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            bot_count: u.tenants?.length ?? 0,
          })),
      };
    } catch {
      return {
        admin: session.user,
        viewing_user_id: null,
        targets: [],
      };
    }
  }
}

export const stopImpersonation = () =>
  request<AuthExchange>("/api/auth/impersonate/stop", { method: "POST" });

export function getMetrics(dias = 3, tenantId?: string) {
  const params = new URLSearchParams({ inactive_days: String(dias) });
  if (tenantId) params.set("tenant_id", tenantId);
  return request<Metrics>(`/api/metrics?${params}`);
}

export function listCandidates(
  filtros: { referralStatus?: ReferralStatus; tenantId?: string; q?: string } = {},
  limit = 50,
) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (filtros.referralStatus) params.set("referral_status", filtros.referralStatus);
  if (filtros.tenantId) params.set("tenant_id", filtros.tenantId);
  if (filtros.q) params.set("q", filtros.q);
  return request<Candidate[]>(`/api/candidates?${params}`);
}

export const getCandidate = (id: string, channel?: "telegram" | "whatsapp") => {
  const q =
    channel === "telegram" || channel === "whatsapp"
      ? `?channel=${encodeURIComponent(channel)}`
      : "";
  return request<CandidateDetail>(`/api/candidates/${id}${q}`);
};

export const confirmReferral = (id: string) =>
  request<Candidate>(`/api/candidates/${id}/confirm-referral`, { method: "POST" });

export const listImprovementCases = (candidateId: string) =>
  request<ImprovementCase[]>(`/api/candidates/${candidateId}/improvements`);

export const createImprovementCase = (
  candidateId: string,
  body: { message_id: number; guidance: string },
) =>
  request<ImprovementCase>(`/api/candidates/${candidateId}/improvements`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const setImprovementCaseActive = (
  candidateId: string,
  caseId: string,
  active: boolean,
) =>
  request<ImprovementCase>(`/api/candidates/${candidateId}/improvements/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });

// --- Administracion ---

export const listUsers = () => request<AdminUser[]>("/api/admin/users");
export const listTenants = () => request<AdminTenant[]>("/api/admin/tenants");

export const createUser = (body: {
  email: string;
  password: string;
  name?: string;
  role: Role;
  /** Se asignan en el alta: un cliente sin bots no ve absolutamente nada. */
  tenant_ids?: string[];
}) => request<SessionUser>("/api/admin/users", { method: "POST", body: JSON.stringify(body) });

/** Baja o alta de un bot. La baja corta la entrada de mensajes al instante. */
export const setTenantActive = (tenantId: string, active: boolean) =>
  request<{ id: string; active: boolean }>(`/api/admin/tenants/${tenantId}`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });

/** Borrado real. El core responde 409 si el bot ya tiene candidatos. */
export const deleteTenant = (tenantId: string) =>
  request<{ id: string; deleted: boolean }>(`/api/admin/tenants/${tenantId}`, {
    method: "DELETE",
  });

export const assignTenants = (userId: string, tenantIds: string[]) =>
  request<unknown>(`/api/admin/users/${userId}/tenants`, {
    method: "PUT",
    body: JSON.stringify({ tenant_ids: tenantIds }),
  });
