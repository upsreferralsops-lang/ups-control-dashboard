"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { AdminTenant, Role } from "@/lib/api";
import { Aviso, Boton, CAMPO, Etiqueta } from "@/components/ui";
import { crearUsuario, type AdminState } from "./actions";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" variante="primario" disabled={pending}>
      {pending ? "Creando…" : "Crear usuario"}
    </Boton>
  );
}

export function NuevoUsuario({ bots }: { bots: AdminTenant[] }) {
  const [state, formAction] = useActionState<AdminState, FormData>(crearUsuario, {
    error: null,
    ok: null,
  });
  const [rol, setRol] = useState<Role>("client");

  const activos = bots.filter((b) => b.active);
  const deBaja = bots.filter((b) => !b.active);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-email" className="eyebrow">
            Correo
          </label>
          <input
            id="nu-email"
            name="email"
            type="email"
            autoComplete="off"
            required
            className={CAMPO}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-name" className="eyebrow">
            Nombre
          </label>
          <input id="nu-name" name="name" type="text" autoComplete="off" className={CAMPO} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-password" className="eyebrow">
            Contraseña
          </label>
          <input
            id="nu-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            className={CAMPO}
            placeholder="mínimo 8 caracteres"
            aria-describedby="nu-password-ayuda"
          />
          <p id="nu-password-ayuda" className="text-xs text-ink-faint">
            Se la tenés que pasar vos: el panel no la muestra de nuevo.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">Rol</span>
          <div className="grid gap-2">
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-control border px-3 py-2.5 transition-colors ${
                rol === "client"
                  ? "border-signal bg-signal-wash"
                  : "border-line bg-surface hover:border-ink-faint"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="client"
                checked={rol === "client"}
                onChange={() => setRol("client")}
                className="mt-0.5 accent-[var(--signal)]"
              />
              <span>
                <span className="block text-sm font-semibold">Cliente</span>
                <span className="text-xs text-ink-soft">Ve solo los bots asignados</span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-control border px-3 py-2.5 transition-colors ${
                rol === "admin"
                  ? "border-signal bg-signal-wash"
                  : "border-line bg-surface hover:border-ink-faint"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="admin"
                checked={rol === "admin"}
                onChange={() => setRol("admin")}
                className="mt-0.5 accent-[var(--signal)]"
              />
              <span>
                <span className="block text-sm font-semibold">Administrador</span>
                <span className="text-xs text-ink-soft">Ve todos los bots por rol</span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {rol === "client" && (
        <fieldset className="flex flex-col gap-2 border-t border-line pt-4">
          <legend className="sr-only">Bots asignados</legend>
          <p className="eyebrow">Bots asignados</p>

          {bots.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No hay bots creados todavía. Creá uno antes de dar de alta a un cliente.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {[...activos, ...deBaja].map((b) => (
                  <label
                    key={b.id}
                    className="flex min-h-9 cursor-pointer items-center gap-2 rounded-panel pr-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      name="tenant_ids"
                      value={b.id}
                      defaultChecked={false}
                      className="h-3.5 w-3.5 accent-[var(--signal)]"
                    />
                    <span className={b.active ? "" : "text-ink-soft"}>{b.name}</span>
                    <Etiqueta>{b.active ? b.channel : "de baja"}</Etiqueta>
                  </label>
                ))}
              </div>
              <Aviso tono="warn">
                Sin al menos un bot, el cliente entra al panel y no ve ningún candidato.
              </Aviso>
            </>
          )}
        </fieldset>
      )}

      {state.error && <Aviso tono="bad">{state.error}</Aviso>}
      {state.ok && <Aviso tono="ok">{state.ok}</Aviso>}

      <div>
        <Enviar />
      </div>
    </form>
  );
}
