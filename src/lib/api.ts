/**
 * Cliente del core (FastAPI). Solo se usa desde el servidor: el token de
 * sesion vive en una cookie httpOnly y nunca lo toca el navegador.
 */

import { cache } from "react";
import { cookies } from "next/headers";

function coreBaseUrl(): string {
  const raw = process.env.CORE_API_URL ?? "http://localhost:8090";
  return raw.trim().replace(/\/$/, "");
}

const BASE_URL = coreBaseUrl();

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
  must_change_password?: boolean;
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
  /** HITL: el bot no le contesta a este candidato; lo atiende una persona. */
  bot_paused?: boolean;
  /** Motivo por el que el bot pidió una persona (se limpia al reanudar). */
  human_escalation_reason?: string | null;
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
  /** Trae imagen adjunta (captura del referido): se pide a /api/media/{id}. */
  has_media?: boolean;
  /** Tipo de adjunto. null con has_media = captura del referido (imagen). */
  media_kind?: "image" | "document" | "voice" | "audio" | null;
  /** Nombre original del archivo (documentos y audios). */
  media_name?: string | null;
  /** Persona que lo escribió desde el panel (HITL). null = el bot. */
  author_name?: string | null;
  /** Aviso automático enviado con el bot pausado (vacante, resultado de referido). */
  is_automatic?: boolean;
};

export type ImprovementCase = {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  candidate_id: string | null;
  message_id: number | null;
  message_direction: "in" | "out";
  anchor_text: string;
  guidance: string;
  title: string | null;
  kind?: "rule" | "correction";
  candidate_name?: string | null;
  active: boolean;
  published: boolean;
  is_global: boolean;
  tested_in_playground_at: string | null;
  created_by: string;
  created_by_email: string | null;
  created_by_name: string | null;
  created_at: string | null;
};

export type PlaygroundMessage = {
  id: number;
  direction: "in" | "out";
  text: string;
  created_at: string | null;
};

export type PlaygroundTurn = {
  session_id: string;
  reply_text: string;
  message_id: number;
  tested_case_ids: string[];
  messages: PlaygroundMessage[];
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

  // Sin token (el propio login), un 401 son credenciales incorrectas: se
  // muestra el detalle del core, no "sesion vencida".
  if (response.status === 401 && auth) {
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

export function changePassword(currentPassword: string, newPassword: string) {
  return request<AuthExchange>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

function normalizarSesion(
  data: Session & { impersonation?: Impersonation | null },
): Session {
  return {
    ...data,
    impersonation: data.impersonation ?? null,
  };
}

/** Una sola llamada a /api/me por request (layout + página comparten cache). */
export const getSession = cache(async (): Promise<Session> => {
  let ultimo: unknown;
  for (let intento = 0; intento < 2; intento++) {
    try {
      const data = await request<Session & { impersonation?: Impersonation | null }>("/api/me");
      return normalizarSesion(data);
    } catch (error) {
      ultimo = error;
      const reintentar =
        error instanceof CoreApiError &&
        error.status != null &&
        error.status >= 500 &&
        intento === 0;
      if (!reintentar) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  throw ultimo;
});

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

export type TenantCredits = {
  tenant_id: string;
  slug?: string | null;
  name?: string | null;
  /** Saldo de la key si tiene tope; si no, el de la cuenta (igual para todas sus keys). */
  remaining_usd: number | null;
  limit_usd: number | null;
  /** Lo que gastó la key de este bot. */
  usage_usd?: number | null;
  threshold_usd: number;
  nivel: "ok" | "bajo" | "agotado" | "desconocido";
  alerta: boolean;
};

export type CreditsSnapshot = {
  threshold_usd: number;
  tenants: TenantCredits[];
  alertas: TenantCredits[];
};

/** Una sola ida al core por request de React (layout + Home). */
export const getCredits = cache(() => request<CreditsSnapshot>("/api/credits"));

export type ItemReporte = { nombre: string; cantidad: number };

export type Reportes = {
  iniciados: number;
  datos_completos: number;
  referidos: number;
  fallidos: number;
  en_espera: number;
  reactivados_por_vacante: number;
  tiempo_promedio_seg: number | null;
  top_trabajos: ItemReporte[];
  top_estados: ItemReporte[];
};

export function getReports(
  filtros: {
    tenantId?: string;
    since?: string;
    until?: string;
    referralStatus?: ReferralStatus;
  } = {},
) {
  const params = new URLSearchParams();
  if (filtros.tenantId) params.set("tenant_id", filtros.tenantId);
  if (filtros.since) params.set("since", filtros.since);
  if (filtros.until) params.set("until", filtros.until);
  if (filtros.referralStatus) params.set("referral_status", filtros.referralStatus);
  const q = params.toString();
  return request<Reportes>(q ? `/api/reports?${q}` : "/api/reports");
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

/** HITL: pausa o reanuda el bot para un candidato. */
export const setCandidateBot = (id: string, active: boolean) =>
  request<{ bot_paused: boolean }>(`/api/candidates/${id}/bot`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });

/** HITL: una persona le escribe al candidato (sale por el bot; pausa el bot). */
export const sendOperatorMessage = (id: string, text: string) =>
  request<{ id: number; created_at: string; author_name: string; bot_paused: boolean }>(
    `/api/candidates/${id}/messages`,
    { method: "POST", body: JSON.stringify({ text }) },
  );

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

export const listTenantImprovementCases = (tenantId: string) =>
  request<ImprovementCase[]>(`/api/tenants/${tenantId}/improvements`);

export const createTenantImprovementCase = (
  tenantId: string,
  body: { guidance: string; title?: string; is_global?: boolean },
) =>
  request<ImprovementCase>(`/api/tenants/${tenantId}/improvements`, {
    method: "POST",
    body: JSON.stringify(body),
  });

export const patchTenantImprovementCase = (
  tenantId: string,
  caseId: string,
  body: {
    guidance?: string;
    title?: string;
    active?: boolean;
    published?: boolean;
    is_global?: boolean;
  },
) =>
  request<ImprovementCase>(`/api/tenants/${tenantId}/improvements/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const playgroundTurn = (
  tenantId: string,
  body: {
    message: string;
    session_id?: string;
    candidate_snapshot?: { first_name?: string; zip?: string };
  },
) =>
  request<PlaygroundTurn>(`/api/tenants/${tenantId}/playground/turn`, {
    method: "POST",
    body: JSON.stringify(body),
  });

/** Encola el re-login de UPS de este cliente. El token nuevo llega cuando termina el job. */
export const renewTenantSession = (tenantId: string) =>
  request<{ ok: boolean; queued: boolean; tenant_id: string }>(
    `/api/tenants/${tenantId}/session/renew`,
    { method: "POST" },
  );

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

export type OpsThread = {
  id: string;
  title: string;
  last_text?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type OpsMessage = {
  id: number;
  author: "user" | "agent";
  text: string;
  created_at: string | null;
};

export type OpsToolRun = {
  id: string;
  tool: string;
  arguments: { _texto?: string } & Record<string, unknown>;
  status: string;
  result: unknown;
  created_at: string | null;
};

export type OpsThreadDetail = OpsThread & {
  messages: OpsMessage[];
  pending: OpsToolRun[];
};

export const listOpsThreads = () => request<OpsThread[]>("/api/ops/threads");

export const createOpsThread = (title = "Nuevo chat") =>
  request<OpsThread>("/api/ops/threads", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

export const startOpsThread = (text: string) =>
  request<OpsThread & { message: OpsMessage }>("/api/ops/threads/start", {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const deleteOpsThread = (id: string) =>
  request<{ ok: boolean }>(`/api/ops/threads/${id}`, { method: "DELETE" });

export const getOpsThread = (id: string) =>
  request<OpsThreadDetail>(`/api/ops/threads/${id}`);

export const postOpsMessage = (id: string, text: string) =>
  request<OpsMessage>(`/api/ops/threads/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });

export const confirmOpsTool = (threadId: string, runId: string) =>
  request<{ ok: boolean; status: string }>(
    `/api/ops/threads/${threadId}/tools/${runId}/confirm`,
    { method: "POST" },
  );

export const rejectOpsTool = (threadId: string, runId: string) =>
  request<{ ok: boolean; status: string }>(
    `/api/ops/threads/${threadId}/tools/${runId}/reject`,
    { method: "POST" },
  );

export type Notificacion = {
  id: number;
  tenant_id: string;
  tenant_name: string | null;
  kind:
    | "credits_low"
    | "credits_depleted"
    | "credits_recharged"
    | "referral_success"
    | "human_escalation"
    | "candidate_waiting"
    | "ups_session_renewed"
    | "ups_session_failed";
  title: string;
  body: string;
  /** Extra según el tipo; los de un candidato traen candidate_id. */
  data?: { candidate_id?: string } | null;
  created_at: string;
  unread: boolean;
};

export type NotificacionesSnapshot = { items: Notificacion[]; unread: number };

export const getNotifications = cache(() => request<NotificacionesSnapshot>("/api/notifications"));

export const markNotificationsRead = (ids?: number[]) =>
  request<{ ok: boolean }>("/api/notifications/read", {
    method: "POST",
    body: JSON.stringify({ ids: ids ?? null }),
  });

/** PWA: clave pública VAPID del core (404 si el push no está configurado). */
export const getPushPublicKey = () => request<{ key: string }>("/api/push/public-key");

export type PushSubscriptionBody = { endpoint: string; keys: { p256dh: string; auth: string } };

export const savePushSubscription = (sub: PushSubscriptionBody) =>
  request<{ ok: boolean }>("/api/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(sub),
  });

export const deletePushSubscription = (endpoint: string) =>
  request<{ ok: boolean }>("/api/push/subscriptions/delete", {
    method: "POST",
    body: JSON.stringify({ endpoint }),
  });
