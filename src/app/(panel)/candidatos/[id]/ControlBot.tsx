"use client";

import { useState, useTransition } from "react";
import { Aviso, Boton } from "@/components/ui";
import { cambiarBot } from "./actions";

/**
 * HITL: pausa o reactiva el bot para este candidato. Pausado, el bot sigue
 * leyendo y actualizando la ficha, pero no le contesta: lo atiende una persona.
 * Nunca se reactiva solo.
 */
export function ControlBot({
  candidateId,
  pausado,
  motivoEscalada,
}: {
  candidateId: string;
  pausado: boolean;
  motivoEscalada: string | null;
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function cambiar(activo: boolean) {
    setError(null);
    iniciar(async () => {
      const r = await cambiarBot(candidateId, activo);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {pausado && motivoEscalada && (
        <Aviso tono="warn" titulo="El bot pidió que lo atienda una persona">
          {motivoEscalada}
        </Aviso>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${
            pausado ? "text-warn-ink" : "text-ok-ink"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${pausado ? "bg-warn" : "bg-ok"}`}
            aria-hidden
          />
          {pausado ? "Bot pausado · lo atiende una persona" : "Bot activo"}
        </span>
        <Boton
          variante={pausado ? "primario" : "neutro"}
          disabled={pendiente}
          onClick={() => cambiar(pausado)}
          className="!min-h-8 !py-1 text-xs"
        >
          {pendiente ? "Guardando…" : pausado ? "Reactivar bot" : "Pausar bot"}
        </Boton>
      </div>
      {error && <Aviso tono="bad">{error}</Aviso>}
    </div>
  );
}
