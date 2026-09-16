"use client";

import { useState, useTransition } from "react";
import type { AdminTenant, Tenant } from "@/lib/api";
import { Boton, Etiqueta } from "@/components/ui";
import { guardarBots } from "./actions";

export function AsignarBots({
  userId,
  asignados,
  disponibles,
  esAdmin,
}: {
  userId: string;
  asignados: Tenant[];
  disponibles: AdminTenant[];
  esAdmin: boolean;
}) {
  const [seleccion, setSeleccion] = useState<string[]>(asignados.map((t) => t.id));
  const [pendiente, startTransition] = useTransition();
  const [guardado, setGuardado] = useState(false);

  if (esAdmin) {
    return <p className="text-sm text-ink-soft">Ve todos los bots por ser administrador.</p>;
  }

  const original = asignados
    .map((t) => t.id)
    .sort()
    .join(",");
  const cambiado = seleccion.slice().sort().join(",") !== original;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {disponibles.map((t) => {
          const marcado = seleccion.includes(t.id);
          return (
            // Toda la etiqueta es zona de click: sin huecos muertos entre el
            // checkbox y su texto, y con alto suficiente para el dedo.
            <label
              key={t.id}
              className="flex min-h-9 cursor-pointer items-center gap-2 rounded-panel pr-1 text-sm transition-colors duration-150 hover:text-ink"
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => {
                  setGuardado(false);
                  setSeleccion((prev) =>
                    marcado ? prev.filter((id) => id !== t.id) : [...prev, t.id],
                  );
                }}
                className="h-3.5 w-3.5 accent-[var(--signal)]"
              />
              <span className={t.active ? "" : "text-ink-soft"}>{t.name}</span>
              {/* Un bot de baja se puede seguir asignando: el cliente conserva
                  el historial que ya tiene, solo deja de entrar gente nueva. */}
              <Etiqueta>{t.active ? t.channel : "de baja"}</Etiqueta>
            </label>
          );
        })}
        {disponibles.length === 0 && (
          <p className="text-sm text-ink-soft">No hay bots creados todavía.</p>
        )}
      </div>

      {(cambiado || guardado) && (
        <div className="flex items-center gap-3">
          {cambiado && (
            <Boton
              variante="primario"
              disabled={pendiente}
              className="min-h-8 px-2.5 py-1 text-xs"
              onClick={() =>
                startTransition(async () => {
                  await guardarBots(userId, seleccion);
                  setGuardado(true);
                })
              }
            >
              {pendiente ? "Guardando…" : "Guardar cambios"}
            </Boton>
          )}
          {guardado && !cambiado && (
            <span role="status" className="text-xs text-ok">
              Asignación guardada.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
