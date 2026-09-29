/** Motivo mostrado en /mantenimiento */
export type TipoEstadoServicio = "core" | "mantenimiento" | "error";

export function rutaEstadoServicio(
  tipo: TipoEstadoServicio,
  extra?: { from?: string },
): string {
  const params = new URLSearchParams({ tipo });
  if (extra?.from) params.set("from", extra.from);
  return `/mantenimiento?${params.toString()}`;
}

export function tipoEstadoServicioDesdeQuery(raw: string | undefined): TipoEstadoServicio {
  if (raw === "mantenimiento" || raw === "error") return raw;
  return "core";
}

/**
 * Detecta fallos del core sin importar `@/lib/api` (usa next/headers).
 * Los Client Components pueden usar este helper de forma segura.
 */
export function esFalloDeCore(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name !== "CoreApiError") return false;
  const status = (error as Error & { status?: number }).status;
  if (status === 401) return false;
  if (status != null && status >= 500) return true;
  return /no se pudo conectar|core respondio/i.test(error.message);
}
