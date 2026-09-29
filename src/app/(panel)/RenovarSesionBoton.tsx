"use client";

import { useState, useTransition } from "react";
import { renovarSesionUps } from "./actions";

export function RenovarSesionBoton({ tenantId }: { tenantId: string }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pendiente}
        title="Re-login UPS para obtener un token de sesión nuevo"
        className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-sunk disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() =>
          iniciar(async () => {
            setMensaje(null);
            const r = await renovarSesionUps(tenantId);
            setMensaje(
              r.error
                ? { ok: false, texto: r.error }
                : { ok: true, texto: r.ok ?? "Re-login encolado." },
            );
          })
        }
      >
        {pendiente ? "Encolando…" : "Renovar sesión"}
      </button>
      {mensaje ? (
        <p
          className={`max-w-52 text-right text-[11px] leading-snug ${
            mensaje.ok ? "text-ok-ink" : "text-bad"
          }`}
        >
          {mensaje.texto}
        </p>
      ) : null}
    </div>
  );
}
