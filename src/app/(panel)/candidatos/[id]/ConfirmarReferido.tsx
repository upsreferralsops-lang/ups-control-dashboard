"use client";

import { useState, useTransition } from "react";
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
      <p className="flex items-center gap-2 text-sm text-ok">
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        Referido confirmado.
      </p>
    );
  }

  if (!preguntando) {
    return (
      <button
        type="button"
        onClick={() => setPreguntando(true)}
        className="rounded-sm bg-ink px-3 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
      >
        Marcar como referido
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Confirmá solo si ya viste el <strong className="text-ink">Congratulations</strong> en
        Internal Mobility. Al confirmar, el candidato recibe el aviso para revisar su correo.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              try {
                await confirmarReferido(candidateId);
              } catch {
                setError("No se pudo confirmar. Revisá que el core esté corriendo.");
              }
            })
          }
          className="rounded-sm bg-ok px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pendiente ? "Confirmando…" : "Sí, ya lo referí"}
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => setPreguntando(false)}
          className="rounded-sm border border-line px-3 py-2 text-sm text-ink-soft hover:border-line-strong hover:text-ink disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" className="border-l-2 border-bad bg-bad-wash px-3 py-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
