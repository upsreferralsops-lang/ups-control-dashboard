/** Payload SSE publicado por el core (`app/dashboard_events.py`). */
export type DashboardSseEvent = {
  type: string;
  tenant_id?: string;
  candidate_id?: string;
  reason?: string;
  referral_status?: string;
  status?: string;
  referral_success?: boolean;
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

/**
 * Decide si router.refresh() aporta algo en la ruta actual.
 * - Ficha: solo el candidate_id de la URL.
 * - Listado: eventos con candidate_id (salvo solo "mensaje_entrante").
 * - Home: solo si mueve metricas y coincide el ?cliente= opcional.
 */
export function shouldRefreshPanel(
  pathname: string,
  search: string,
  event: DashboardSseEvent,
): boolean {
  if (event.type !== "candidate_updated" || !event.candidate_id) return false;

  const cliente = new URLSearchParams(search).get("cliente") ?? "";

  const ficha = pathname.match(/^\/candidatos\/([^/]+)\/?$/);
  if (ficha) {
    return event.candidate_id === ficha[1];
  }

  if (pathname === "/candidatos") {
    if (!respetaFiltroCliente(event, cliente)) return false;
    if (event.reason === "mensaje_entrante") return false;
    return true;
  }

  if (pathname === "/") {
    if (!eventAfectaMetricas(event)) return false;
    return respetaFiltroCliente(event, cliente);
  }

  if (pathname.startsWith("/admin")) return false;

  return false;
}
