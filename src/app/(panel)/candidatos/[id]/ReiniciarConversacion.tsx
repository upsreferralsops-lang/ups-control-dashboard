"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Boton } from "@/components/ui";
import { IconoActualizar } from "@/lib/icons";
import { reiniciarConversacion } from "./actions";

/**
 * Para pruebas: borra el candidato, su chat y sus datos. Si vuelve a
 * escribir, el bot lo atiende como a alguien nuevo. No se puede deshacer.
 * Vive en la barra del chat, que en el teléfono queda fija al hacer scroll.
 * Mismo modal que "Borrar regla" (BancoReglas): <dialog> nativo.
 */
export function ReiniciarConversacion({
  candidateId,
  className = "",
}: {
  candidateId: string;
  className?: string;
}) {
  const router = useRouter();
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function reiniciar() {
    setError(null);
    iniciar(async () => {
      const r = await reiniciarConversacion(candidateId);
      if (r.ok) {
        dialogoRef.current?.close();
        router.replace("/candidatos");
      } else setError(r.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogoRef.current?.showModal()}
        aria-label="Reiniciar conversación"
        title="Reiniciar conversación (borra el chat y los datos del candidato)"
        className={className}
      >
        <IconoActualizar className="h-4 w-4" />
      </button>

      <dialog
        ref={dialogoRef}
        onClose={() => setError(null)}
        onCancel={(e) => pendiente && e.preventDefault()}
        aria-labelledby="reiniciar-conversacion-titulo"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-panel border border-line bg-surface p-5 text-ink shadow-xl backdrop:bg-black/40"
      >
        <h2 id="reiniciar-conversacion-titulo" className="text-base font-semibold">
          ¿Reiniciar la conversación?
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Se borran el chat y todos los datos del candidato. Si vuelve a escribir, el bot lo
          atiende como a alguien nuevo. No se puede deshacer.
        </p>
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Boton type="button" disabled={pendiente} onClick={() => dialogoRef.current?.close()}>
            Cancelar
          </Boton>
          <button
            type="button"
            disabled={pendiente}
            onClick={reiniciar}
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-transparent bg-bad px-4 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
          >
            {pendiente ? "Reiniciando…" : "Reiniciar"}
          </button>
        </div>
      </dialog>
    </>
  );
}
