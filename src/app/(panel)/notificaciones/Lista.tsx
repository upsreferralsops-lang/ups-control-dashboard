"use client";

import { useState } from "react";
import type { Notificacion } from "@/lib/api";
import { IconoAlerta, IconoCheck, IconoOk } from "@/lib/icons";
import { marcarLeidas } from "./actions";

const TONO: Record<Notificacion["kind"], { Icono: typeof IconoOk; caja: string }> = {
  credits_low: { Icono: IconoAlerta, caja: "bg-warn-wash text-warn-ink" },
  credits_depleted: { Icono: IconoAlerta, caja: "bg-bad-wash text-bad-ink" },
  credits_recharged: { Icono: IconoCheck, caja: "bg-sunk text-ink" },
  referral_success: { Icono: IconoOk, caja: "bg-sunk text-ink" },
};

function cuando(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ListaNotificaciones({ items, noLeidas }: { items: Notificacion[]; noLeidas: number }) {
  const [error, setError] = useState<string | null>(null);

  async function marcar(ids?: number[]) {
    setError((await marcarLeidas(ids)).error);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          {noLeidas > 0 ? `${noLeidas} sin leer` : "Todo al día"}
        </p>
        {noLeidas > 0 && (
          <button
            type="button"
            className="rounded-control border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
            onClick={() => marcar()}
          >
            Marcar todas como leídas
          </button>
        )}
      </div>
      {error && <p className="text-sm text-bad-ink" role="alert">{error}</p>}
      {items.length === 0 ? (
        <p className="rounded-panel border border-line bg-surface p-6 text-sm text-ink-soft">
          Todavía no hay notificaciones. Acá vas a ver saldo bajo, recargas y referidos exitosos.
        </p>
      ) : (
        <ul className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface">
          {items.map((n) => {
            const { Icono, caja } = TONO[n.kind];
            return (
              <li key={n.id} className="flex items-start gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${caja}`}>
                  <Icono className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm text-ink ${n.unread ? "font-semibold" : ""}`}>{n.title}</p>
                  {n.body && <p className="mt-0.5 max-w-[65ch] text-sm text-ink-soft">{n.body}</p>}
                  <p className="mt-1 text-xs text-ink-faint">{cuando(n.created_at)}</p>
                </div>
                {n.unread && (
                  <button
                    type="button"
                    aria-label="Marcar como leída"
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-signal"
                    onClick={() => marcar([n.id])}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
