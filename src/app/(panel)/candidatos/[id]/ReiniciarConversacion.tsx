"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { IconoActualizar } from "@/lib/icons";
import { reiniciarConversacion } from "./actions";

/**
 * Para pruebas: borra el candidato, su chat y sus datos. Si vuelve a
 * escribir, el bot lo atiende como a alguien nuevo. No se puede deshacer.
 * Vive en la barra del chat, que en el teléfono queda fija al hacer scroll.
 */
export function ReiniciarConversacion({
  candidateId,
  className = "",
}: {
  candidateId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  function reiniciar() {
    // ponytail: confirm nativo, se ve bien en el teléfono y no ocupa lugar en la barra
    if (!window.confirm("¿Reiniciar la conversación?\n\nSe borran el chat y todos los datos del candidato. No se puede deshacer.")) return;
    iniciar(async () => {
      const r = await reiniciarConversacion(candidateId);
      if (r.ok) router.replace("/candidatos");
      else window.alert(r.error);
    });
  }

  return (
    <button
      type="button"
      onClick={reiniciar}
      disabled={pendiente}
      aria-label="Reiniciar conversación"
      title="Reiniciar conversación (borra el chat y los datos del candidato)"
      className={`${className} ${pendiente ? "animate-spin" : ""}`}
    >
      <IconoActualizar className="h-4 w-4" />
    </button>
  );
}
