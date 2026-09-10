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
  const [confirmando, setConfirmando] = useState(false);

  if (yaConfirmado) {
    return (
      <p className="text-sm text-emerald-700 dark:text-emerald-400">
        Referido confirmado.
      </p>
    );
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        Marcar como referido
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Confirma solo si ya viste el <strong>Congratulations</strong> en Internal Mobility.
        Al confirmar, el candidato recibe el aviso para revisar su correo.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pendiente}
          onClick={() =>
            startTransition(async () => {
              try {
                await confirmarReferido(candidateId);
              } catch {
                setError("No se pudo confirmar. Revisa que el core este corriendo.");
              }
            })
          }
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {pendiente ? "Confirmando…" : "Si, ya lo referi"}
        </button>
        <button
          type="button"
          disabled={pendiente}
          onClick={() => setConfirmando(false)}
          className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
