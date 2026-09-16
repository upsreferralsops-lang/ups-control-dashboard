"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cerrarSesion } from "@/app/actions/auth";
import { impersonarUsuario, volverVistaAdmin } from "@/app/actions/impersonate";
import type { ImpersonationTargets, SessionUser } from "@/lib/api";
import { IconoIntercambio, IconoSalir } from "@/lib/icons";

export function PieSesion({
  user,
  subtitulo,
  vista,
  mostrarSwitch,
}: {
  user: SessionUser;
  subtitulo: string;
  vista: ImpersonationTargets | null;
  mostrarSwitch: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  const enVistaCliente = vista?.viewing_user_id != null;
  const sinClientes = !vista?.targets.length;

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  function elegir(accion: () => Promise<void>) {
    setError(null);
    iniciar(async () => {
      try {
        await accion();
      } catch {
        setError("No se pudo cambiar la vista.");
      }
    });
  }

  return (
    <div ref={panelRef} className="relative">
      {abierto && mostrarSwitch && vista && (
        <div
          role="listbox"
          aria-label="Cambiar vista de usuario"
          className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-64 overflow-y-auto rounded-panel border border-line bg-surface py-1 shadow-lg"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
            Cambiar vista
          </p>
          <button
            type="button"
            role="option"
            aria-selected={!enVistaCliente}
            disabled={pendiente || !enVistaCliente}
            className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-sunk disabled:opacity-50 ${
              !enVistaCliente ? "bg-brand-wash/60" : ""
            }`}
            onClick={() => {
              if (!enVistaCliente) return;
              elegir(async () => {
                const result = await volverVistaAdmin();
                if (result?.ok === false) setError(result.error);
              });
            }}
          >
            <span className="font-semibold text-ink">
              {vista.admin.name ?? vista.admin.email}
            </span>
            <span className="text-xs text-ink-soft">Admin general · vista completa</span>
          </button>
          {sinClientes ? (
            <p className="px-3 py-3 text-xs text-ink-soft">
              Todavía no hay usuarios cliente registrados en el panel.
            </p>
          ) : (
            <>
              <div className="my-1 border-t border-line" />
              {vista.targets.map((t) => {
            const activo = vista.viewing_user_id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={activo}
                disabled={pendiente || activo}
                className={`flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors hover:bg-sunk disabled:opacity-50 ${
                  activo ? "bg-brand-wash/60" : ""
                }`}
                onClick={() => {
                  if (activo) return;
                  elegir(async () => {
                    const result = await impersonarUsuario(t.id);
                    if (result?.ok === false) setError(result.error);
                  });
                }}
              >
                <span className="font-semibold text-ink">{t.name ?? t.email}</span>
                <span className="text-xs text-ink-soft">
                  {t.email}
                  {t.bot_count > 0
                    ? ` · ${t.bot_count} bot${t.bot_count === 1 ? "" : "s"}`
                    : " · sin bots"}
                </span>
              </button>
            );
          })}
            </>
          )}
          {error && <p className="px-3 py-2 text-xs text-bad">{error}</p>}
        </div>
      )}

      {abierto && mostrarSwitch && !vista && (
        <div className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-panel border border-line bg-surface px-3 py-2 text-xs text-ink-soft shadow-lg">
          No se pudo cargar la lista de usuarios. Verificá que el core esté actualizado.
        </div>
      )}

      <div className="flex items-center justify-between gap-2 rounded-xl bg-sunk p-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-wash text-xs font-semibold text-brand">
            {(user.name ?? user.email).slice(0, 2).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs font-semibold">{user.name ?? user.email}</span>
            <span className="truncate text-[11px] text-ink-soft">{subtitulo}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {mostrarSwitch && (
            <button
              type="button"
              aria-label="Cambiar vista de usuario"
              aria-expanded={abierto}
              title="Cambiar vista"
              disabled={pendiente}
              onClick={() => setAbierto((v) => !v)}
              className={`grid h-7 w-7 place-items-center rounded-lg border border-transparent transition-colors duration-150 ${
                abierto || enVistaCliente
                  ? "border-line bg-surface text-brand"
                  : "text-ink-soft hover:border-line hover:bg-surface hover:text-brand"
              }`}
            >
              <IconoIntercambio className="h-[17px] w-[17px]" />
            </button>
          )}
          <form action={cerrarSesion}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition-colors duration-150 hover:bg-surface hover:text-brand"
            >
              <IconoSalir className="h-[17px] w-[17px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
