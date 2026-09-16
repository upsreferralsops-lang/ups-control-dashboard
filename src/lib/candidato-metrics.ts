import type { Candidate, CandidateDetailMetrics } from "@/lib/api";

/** Si la API aún no manda last_position (core desactualizado). */
export function metricsConFallback(
  metrics: CandidateDetailMetrics,
  c: Candidate & Record<string, unknown>,
): CandidateDetailMetrics {
  if (metrics.last_position?.title) return metrics;
  const name = (c.matched_warehouse_name as string | null)?.trim();
  if (!name) return { ...metrics, last_position: null };
  return {
    ...metrics,
    last_position: {
      title: name,
      url: (c.matched_job_url as string | null) ?? null,
      location: null,
    },
  };
}
