"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { parseDashboardEvent, shouldRefreshPanel } from "@/lib/sse-events";

/**
 * SSE del panel: refresh selectivo por ruta y candidate_id (menos carga en home).
 */
export function SseRefresh({ userId }: { userId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let es: EventSource | null = null;
    let reconectar: ReturnType<typeof setTimeout> | undefined;
    let activo = true;

    function conectar() {
      if (!activo) return;
      es = new EventSource("/api/events");

      es.onmessage = (msg) => {
        const event = parseDashboardEvent(msg.data);
        if (!event) return;
        const path = window.location.pathname;
        const search = window.location.search;
        if (shouldRefreshPanel(path, search, event, userId)) {
          router.refresh();
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!activo) return;
        reconectar = setTimeout(conectar, 8000);
      };
    }

    conectar();

    return () => {
      activo = false;
      if (reconectar) clearTimeout(reconectar);
      es?.close();
    };
  }, [pathname, router, userId]);

  return null;
}
