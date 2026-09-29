/** Payload SSE publicado por el core (`app/dashboard_events.py`). */
export type DashboardSseEvent = {
  type: string;
  tenant_id?: string;
  candidate_id?: string;
  reason?: string;
  referral_status?: string;
  status?: string;
  referral_success?: boolean;
  remaining_usd?: number | null;
  nivel?: string;
  user_id?: string;
  thread_id?: string;
};

export function parseDashboardEvent(raw: string): DashboardSseEvent | null {
  try {
    const data = JSON.parse(raw) as DashboardSseEvent;
    if (!data?.type) return null;
    return data;
  } catch {
    return null;
  }
}

/** Cambios que mueven KPIs del home; un mensaje entrante aun no los toca. */
export function eventAfectaMetricas(event: DashboardSseEvent): boolean {
  if (event.type !== "candidate_updated") return false;
  if (event.reason === "mensaje_entrante") return false;
  if (event.referral_status != null || event.status != null) return true;
  if (event.reason === "referral_result") return true;
  if (event.referral_success !== undefined) return true;
  return false;
}

function respetaFiltroCliente(event: DashboardSseEvent, clienteId: string): boolean {
  if (!clienteId) return true;
  if (!event.tenant_id) return true;
  return event.tenant_id === clienteId;
}

/** Home usa ?cliente=; Reportes y el listado usan ?bot=. */
function tenantFiltroEnUrl(search: string): string {
  const q = new URLSearchParams(search);
  return q.get("cliente") || q.get("bot") || "";
}

/**
 * Decide si router.refresh() aporta algo en la ruta actual.
 * - Ficha y /conversacion: solo el candidate_id de la URL (incluye mensaje_entrante).
 * - Listado: eventos con candidate_id (salvo solo "mensaje_entrante").
 * - Home y Reportes: solo si mueve metricas y coincide ?cliente= o ?bot=.
 */
export function shouldRefreshPanel(
  pathname: string,
  search: string,
  event: DashboardSseEvent,
  userId?: string,
): boolean {
  if (event.type === "ops_message") {
    if (!pathname.startsWith("/asistente")) return false;
    if (userId && event.user_id && event.user_id !== userId) return false;
    return true;
  }
  if (event.type === "credits_low" || event.type === "notification") {
    return true;
  }
  if (event.type !== "candidate_updated" || !event.candidate_id) return false;

  const tenantFiltro = tenantFiltroEnUrl(search);

  const ficha = pathname.match(/^\/candidatos\/([^/]+)/);
  if (ficha && pathname !== "/candidatos") {
    return event.candidate_id === ficha[1];
  }

  if (pathname === "/candidatos") {
    if (!respetaFiltroCliente(event, tenantFiltro)) return false;
    if (event.reason === "mensaje_entrante") return false;
    return true;
  }

  if (pathname === "/") {
    if (!eventAfectaMetricas(event)) return false;
    return respetaFiltroCliente(event, tenantFiltro);
  }

  if (pathname === "/reportes" || pathname.startsWith("/reportes/")) {
    if (!eventAfectaMetricas(event)) return false;
    return respetaFiltroCliente(event, tenantFiltro);
  }

  if (pathname.startsWith("/admin")) return false;

  return false;
}
