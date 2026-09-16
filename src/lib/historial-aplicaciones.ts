import type { ApplicationHistoryEntry } from "./api";
import { etiquetaApplicationStatus } from "./status";

export const HISTORIAL_POR_PAGINA_DEFAULT = 5;
export const HISTORIAL_POR_PAGINA_MAX = 50;

export type FiltroHistorialTipo = "todos" | "exitosa" | "fallida" | "seguimiento";

export type FiltrosHistorial = {
  q: string;
  tipo: FiltroHistorialTipo;
  pagina: number;
  porPagina: number;
};

export function parseFiltrosHistorial(raw: {
  q?: string;
  tipo?: string;
  elegidas?: string;
  pagina?: string;
  por_pagina?: string;
}): FiltrosHistorial {
  const tipoRaw = raw.tipo ?? "todos";
  const tipo: FiltroHistorialTipo =
    tipoRaw === "exitosa" ||
    tipoRaw === "fallida" ||
    tipoRaw === "seguimiento" ||
    tipoRaw === "todos" ||
    tipoRaw === "vacante" ||
    tipoRaw === "referido"
      ? tipoRaw === "vacante"
        ? "exitosa"
        : tipoRaw === "referido"
          ? "fallida"
          : (tipoRaw as FiltroHistorialTipo)
      : "todos";

  let porPagina = Number(raw.por_pagina) || HISTORIAL_POR_PAGINA_DEFAULT;
  porPagina = Math.min(HISTORIAL_POR_PAGINA_MAX, Math.max(5, porPagina));

  let pagina = Math.max(1, Number(raw.pagina) || 1);

  return {
    q: (raw.q ?? "").trim(),
    tipo,
    pagina,
    porPagina,
  };
}

function textoBusqueda(entry: ApplicationHistoryEntry): string {
  const partes: string[] = [entry.kind];
  if (entry.occurred_at) partes.push(entry.occurred_at);
  if (entry.kind === "referral_attempt") {
    partes.push(
      entry.title ?? "",
      entry.location ?? "",
      entry.job_type ?? "",
      entry.posting_id ?? "",
      entry.url ?? "",
      entry.error ?? "",
    );
    if (entry.success === true) partes.push("exitosa ok");
    if (entry.success === false) partes.push("fallida fallo");
  } else {
    partes.push(
      entry.application_status,
      etiquetaApplicationStatus(entry.application_status),
      entry.matched_warehouse_name ?? "",
      entry.matched_job_url ?? "",
      entry.fountain_personal_url ?? "",
    );
  }
  return partes.join(" ").toLowerCase();
}

export function filtrarHistorial(
  entries: ApplicationHistoryEntry[],
  filtros: FiltrosHistorial,
): ApplicationHistoryEntry[] {
  let out = entries;

  if (filtros.tipo === "exitosa") {
    out = out.filter((e) => e.kind === "referral_attempt" && e.success === true);
  } else if (filtros.tipo === "fallida") {
    out = out.filter((e) => e.kind === "referral_attempt" && e.success === false);
  } else if (filtros.tipo === "seguimiento") {
    out = out.filter((e) => e.kind === "application_tracking");
  }

  const q = filtros.q.toLowerCase();
  if (q) {
    out = out.filter((e) => textoBusqueda(e).includes(q));
  }

  return out;
}

function timestampOrden(entry: ApplicationHistoryEntry): number {
  const iso = entry.occurred_at ?? (entry.kind === "referral_attempt" ? entry.submitted_at : null);
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

/** Más reciente primero (la API ya ordena; esto cubre filtros locales). */
export function ordenarHistorialDesc(entries: ApplicationHistoryEntry[]): ApplicationHistoryEntry[] {
  return [...entries].sort((a, b) => timestampOrden(b) - timestampOrden(a));
}

export function formatFechaHistorial(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function paginarHistorial<T>(
  items: T[],
  pagina: number,
  porPagina: number,
): { items: T[]; pagina: number; totalPaginas: number; total: number; desde: number; hasta: number } {
  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina) || 1);
  const paginaSafe = Math.min(pagina, totalPaginas);
  const desde = total === 0 ? 0 : (paginaSafe - 1) * porPagina + 1;
  const slice = items.slice((paginaSafe - 1) * porPagina, paginaSafe * porPagina);
  const hasta = total === 0 ? 0 : (paginaSafe - 1) * porPagina + slice.length;

  return {
    items: slice,
    pagina: paginaSafe,
    totalPaginas,
    total,
    desde,
    hasta,
  };
}

export function etiquetaTipoHistorial(entry: ApplicationHistoryEntry): string {
  if (entry.kind === "referral_attempt") {
    return entry.success ? "Aplicación exitosa" : "Referido fallido";
  }
  if (entry.kind === "application_tracking") {
    return "Seguimiento";
  }
  return "Evento";
}

export function resumenFila(entry: ApplicationHistoryEntry): {
  titulo: string;
  subtitulo: string;
  estado: string | null;
} {
  if (entry.kind === "referral_attempt") {
    let estado: string | null = null;
    if (entry.success === true) estado = "Completado";
    if (entry.success === false) estado = "Falló";
    return {
      titulo: entry.title || "Posición aplicada",
      subtitulo: [entry.location, entry.job_type].filter(Boolean).join(" · ") || "—",
      estado,
    };
  }
  return {
    titulo: entry.matched_warehouse_name || "Seguimiento de aplicación",
    subtitulo: etiquetaApplicationStatus(entry.application_status),
    estado: null,
  };
}

export function historialQueryString(
  filtros: FiltrosHistorial,
  patch: Partial<FiltrosHistorial> & { pagina?: number },
): string {
  const next: FiltrosHistorial = { ...filtros, ...patch };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  if (next.tipo !== "todos") p.set("tipo", next.tipo);
  if (next.pagina > 1) p.set("pagina", String(next.pagina));
  if (next.porPagina !== HISTORIAL_POR_PAGINA_DEFAULT) {
    p.set("por_pagina", String(next.porPagina));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}
