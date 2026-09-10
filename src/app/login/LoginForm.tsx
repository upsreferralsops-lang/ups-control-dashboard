"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarSesion, type LoginState } from "@/app/actions/auth";

function Boton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60"
    >
      {pending ? "Entrando…" : "Entrar"}
    </button>
  );
}

const campo =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal";

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(iniciarSesion, {
    error: null,
  });

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="eyebrow">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={campo}
          placeholder="tu@correo.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="eyebrow">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={campo}
        />
      </div>

      {state.error && (
        <p role="alert" className="border-l-2 border-bad bg-bad-wash px-3 py-2 text-sm text-ink">
          {state.error}
        </p>
      )}

      <Boton />
    </form>
  );
}
