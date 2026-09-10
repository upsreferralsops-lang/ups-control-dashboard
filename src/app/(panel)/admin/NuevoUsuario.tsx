"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearUsuario, type AdminState } from "./actions";

const campo =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm placeholder:text-ink-faint focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-sm bg-ink px-3 py-2 text-sm font-medium text-paper disabled:opacity-60"
    >
      {pending ? "Creando…" : "Crear usuario"}
    </button>
  );
}

export function NuevoUsuario() {
  const [state, formAction] = useActionState<AdminState, FormData>(crearUsuario, {
    error: null,
    ok: null,
  });

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-email" className="eyebrow">
            Correo
          </label>
          <input id="nu-email" name="email" type="email" required className={campo} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-name" className="eyebrow">
            Nombre
          </label>
          <input id="nu-name" name="name" type="text" className={campo} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-password" className="eyebrow">
            Contraseña
          </label>
          <input
            id="nu-password"
            name="password"
            type="password"
            required
            minLength={8}
            className={campo}
            placeholder="mínimo 8 caracteres"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nu-role" className="eyebrow">
            Rol
          </label>
          <select id="nu-role" name="role" defaultValue="client" className={campo}>
            <option value="client">Cliente — ve solo sus bots</option>
            <option value="admin">Administrador — ve todo</option>
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="border-l-2 border-bad bg-bad-wash px-3 py-2 text-sm">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="border-l-2 border-ok bg-ok-wash px-3 py-2 text-sm">
          {state.ok} Ahora asignale sus bots en la tabla de abajo.
        </p>
      )}

      <div>
        <Boton />
      </div>
    </form>
  );
}
