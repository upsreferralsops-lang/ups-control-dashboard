"use client";

import { useEffect } from "react";
import { marcarLeidas } from "@/app/(panel)/notificaciones/actions";

/**
 * Ver la conversacion es leer sus avisos: las notificaciones sin leer de este
 * candidato se marcan solas. Si llega una nueva con el chat abierto, el SSE
 * refresca la pagina y vuelve a pasar por aca. Con la pestaña en segundo
 * plano espera a que vuelva a estar visible: abierto no es lo mismo que visto.
 */
export function MarcarLeidasAlVer({ ids }: { ids: number[] }) {
  const clave = ids.join(",");

  useEffect(() => {
    if (!clave) return;
    const marcar = () => {
      if (document.visibilityState === "visible") void marcarLeidas(clave.split(",").map(Number));
    };
    marcar();
    document.addEventListener("visibilitychange", marcar);
    return () => document.removeEventListener("visibilitychange", marcar);
  }, [clave]);

  return null;
}
