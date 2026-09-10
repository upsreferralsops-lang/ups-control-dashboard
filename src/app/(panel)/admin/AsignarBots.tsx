"use client";

import { useState, useTransition } from "react";
import type { AdminTenant, Tenant } from "@/lib/api";
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

  const original = asignados.map((t) => t.id).sort().join(",");
  const cambiado = seleccion.slice().sort().join(",") !== original;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {disponibles.map((t) => {
          const marcado = seleccion.includes(t.id);
          return (
            <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
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
              <span>{t.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                {t.channel}
              </span>
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
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                startTransition(async () => {
                  await guardarBots(userId, seleccion);
                  setGuardado(true);
                })
              }
              className="rounded-sm bg-ink px-2.5 py-1 text-xs font-medium text-paper disabled:opacity-60"
            >
              {pendiente ? "Guardando…" : "Guardar cambios"}
            </button>
          )}
          {guardado && !cambiado && <span className="text-xs text-ok">Asignación guardada.</span>}
        </div>
      )}
    </div>
  );
}
