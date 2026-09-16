"use client";

import { useState, useTransition } from "react";
import { Aviso, Boton } from "@/components/ui";
import { confirmarReferido } from "./actions";

export function ConfirmarReferido({
  candidateId,
  yaConfirmado,
}: {
  candidateId: string;
  yaConfirmado: boolean;
}) {
  const [pendiente, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preguntando, setPreguntando] = useState(false);

  if (yaConfirmado) {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-ok-ink">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
        Referido confirmado.
      </p>
    );
  }

  if (!preguntando) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-ink-soft">
          Marcá el referido solo cuando ya lo verificaste en Internal Mobility.
        </p>
        <Boton variante="primario" onClick={() => setPreguntando(true)}>
          Marcar como referido
        </Boton>
        <p className="text-xs text-ink-faint">Estado actual: no confirmado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-control border border-warn-border bg-warn-wash px-3 py-2.5">
        <p className="text-sm text-warn-ink">
          Confirmá solo si ya viste el <strong>Congratulations</strong> en Internal Mobility. Esto
          marca el caso como referido en la consola.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Boton
          variante="ok"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await confirmarReferido(candidateId);
              } catch {
                setError("No se pudo confirmar. Revisá que el core esté corriendo.");
              }
            })
          }
        >
          {pendiente ? "Confirmando…" : "Sí, ya lo referí"}
        </Boton>
        <Boton disabled={pendiente} onClick={() => setPreguntando(false)}>
          Cancelar
        </Boton>
      </div>
      {error && <Aviso tono="bad">{error}</Aviso>}
    </div>
  );
}
