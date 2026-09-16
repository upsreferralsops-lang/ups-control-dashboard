"use client";

import { useState, useTransition } from "react";
import type { AdminTenant } from "@/lib/api";
import { Aviso, Boton, Etiqueta } from "@/components/ui";
import { borrarBot, cambiarEstadoBot } from "./actions";

/**
 * Tarjeta de un bot con estados canónicos: activo, de baja, eliminable.
 *
 * - Dar de baja: saca de circulación (webhook rechaza inactivos) y conserva historial.
 * - Eliminar: solo si nunca tuvo candidatos; el core rechaza con historial.
 */
export function Bot({ bot, parte }: { bot: AdminTenant; parte: number }) {
  const [pendiente, iniciar] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sinUso = bot.candidatos === 0;
  const pct = Math.round(parte);

  return (
    <div
      className={`flex flex-col rounded-panel border border-line bg-surface px-4 py-3 ${
        bot.active ? "" : "bg-sunk/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold ${bot.active ? "" : "text-ink-soft"}`}>
            {bot.name}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ink-faint">
            {bot.bot_handle ?? bot.slug}
          </p>
        </div>
        <Etiqueta>{bot.channel}</Etiqueta>
      </div>

      {bot.active ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ok-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-ok" aria-hidden />
          Activo
        </p>
      ) : (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-warn-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden />
          De baja — no recibe mensajes
        </p>
      )}

      <p className="mt-3 text-lg font-semibold tabular-nums">
        {bot.candidatos}
        <span className="ml-1.5 text-xs font-normal text-ink-faint">candidatos</span>
      </p>
      <div className="mt-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
        <span>Volumen</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sunk" aria-hidden>
        <div
          className={`h-full rounded-full ${bot.active ? "bg-signal" : "bg-ink-faint"}`}
          style={{ width: `${Math.max(parte, bot.candidatos > 0 ? 4 : 0)}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
        <Boton
          disabled={pendiente}
          variante={bot.active ? "neutro" : "accent"}
          className="min-h-8 px-2.5 py-1 text-xs"
          onClick={() =>
            iniciar(async () => {
              setError(null);
              await cambiarEstadoBot(bot.id, !bot.active);
            })
          }
        >
          {bot.active ? "Dar de baja" : "Reactivar"}
        </Boton>

        {sinUso &&
          (confirmando ? (
            <>
              <Boton
                disabled={pendiente}
                className="min-h-8 border-bad px-2.5 py-1 text-xs text-bad hover:bg-bad-wash hover:text-bad"
                onClick={() =>
                  iniciar(async () => {
                    const r = await borrarBot(bot.id);
                    setError(r.error);
                    setConfirmando(false);
                  })
                }
              >
                {pendiente ? "Eliminando…" : "Confirmar"}
              </Boton>
              <Boton
                disabled={pendiente}
                className="min-h-8 px-2.5 py-1 text-xs"
                onClick={() => setConfirmando(false)}
              >
                Cancelar
              </Boton>
            </>
          ) : (
            <Boton
              disabled={pendiente}
              className="min-h-8 border-bad/40 px-2.5 py-1 text-xs text-bad hover:border-bad hover:bg-bad-wash"
              onClick={() => setConfirmando(true)}
            >
              Eliminar
            </Boton>
          ))}
      </div>

      {confirmando && (
        <p className="mt-2 text-xs text-ink-soft">
          Se borra el bot y su asignación a usuarios. No tiene candidatos, así que no se pierde
          historial.
        </p>
      )}

      {sinUso && !confirmando && bot.active && (
        <p className="mt-2 text-xs text-ink-faint">Sin tráfico — se puede eliminar.</p>
      )}

      {!sinUso && (
        <p className="mt-2 text-xs text-ink-faint">
          Con candidatos no se puede eliminar: la baja lo saca de circulación sin borrar el
          historial.
        </p>
      )}

      {error && (
        <div className="mt-2">
          <Aviso tono="bad">{error}</Aviso>
        </div>
      )}
    </div>
  );
}
