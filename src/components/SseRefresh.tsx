"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseDashboardEvent, shouldRefreshPanel } from "@/lib/sse-events";

/**
 * SSE del panel: refresh selectivo por ruta y candidate_id (menos carga en home).
 */
export function SseRefresh() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const es = new EventSource("/api/events");

    es.onmessage = (msg) => {
      const event = parseDashboardEvent(msg.data);
      if (!event) return;
      const search = typeof window !== "undefined" ? window.location.search : "";
      if (shouldRefreshPanel(pathname, search, event)) {
        router.refresh();
      }
    };

    return () => es.close();
  }, [pathname, router]);

  return null;
}
