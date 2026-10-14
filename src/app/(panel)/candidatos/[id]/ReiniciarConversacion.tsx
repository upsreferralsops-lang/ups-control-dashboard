"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Aviso, Boton } from "@/components/ui";
import { reiniciarConversacion } from "./actions";

/**
 * Para pruebas: borra el candidato, su chat y sus datos. Si vuelve a
 * escribir, el bot lo atiende como a alguien nuevo. No se puede deshacer.
 */
export function ReiniciarConversacion({ candidateId }: { candidateId: string }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reiniciar() {
    setError(null);
    iniciar(async () => {
      const r = await reiniciarConversacion(candidateId);
      if (r.ok) router.replace("/candidatos");
      else {
        setError(r.error);
        setConfirmando(false);
      }
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-2">
      {confirmando ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-xs text-ink-soft">
            Se borran el chat y todos los datos del candidato. No se puede deshacer.
          </span>
          <Boton
            disabled={pendiente}
            className="!min-h-8 border-bad !py-1 text-xs text-bad hover:bg-bad-wash hover:text-bad"
            onClick={reiniciar}
          >
            {pendiente ? "Borrando…" : "Sí, reiniciar"}
          </Boton>
          <Boton
            disabled={pendiente}
            className="!min-h-8 !py-1 text-xs"
            onClick={() => setConfirmando(false)}
          >
            Cancelar
          </Boton>
        </div>
      ) : (
        <Boton
          className="!min-h-8 !py-1 text-xs"
          title="Borra el chat y los datos del candidato para probar el flujo desde cero"
          onClick={() => setConfirmando(true)}
        >
          Reiniciar conversación
        </Boton>
      )}
      {error && <Aviso tono="bad">{error}</Aviso>}
    </div>
  );
}
