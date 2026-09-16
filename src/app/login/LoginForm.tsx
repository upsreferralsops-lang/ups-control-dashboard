"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Aviso, Boton, CAMPO } from "@/components/ui";
import { iniciarSesion, type LoginState } from "@/app/actions/auth";
import { IconoCheck, IconoEntrar, IconoInfo, IconoOjo, IconoOjoTachado } from "@/lib/icons";

/** A quien escribe el operador que no ve sus bots. Cambialo por el real. */
const SOPORTE = "soporte@upsreferidos.com";

// El login usa esquinas mas suaves que el resto del panel: es la unica
// pantalla sin densidad de datos, y el mockup la pide asi.
const CAMPO_LOGIN =
  `${CAMPO} min-h-12 rounded-panel py-3 text-base sm:min-h-11 sm:text-sm`;

function Entrar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" variante="primario" disabled={pending} className="mt-1 w-full rounded-panel py-3.5">
      <IconoEntrar className="h-4 w-4" />
      {pending ? "Entrando…" : "Iniciar Sesión en Consola"}
    </Boton>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(iniciarSesion, {
    error: null,
  });
  const [verClave, setVerClave] = useState(false);
  // El check verde del mockup: se enciende cuando el correo ya es valido, no
  // cuando el usuario escribio algo. Es la validacion nativa del input, sin
  // regex propia que se desincronice con la del navegador.
  const [emailOk, setEmailOk] = useState(false);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="eyebrow">
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby="email-ayuda"
            onChange={(e) => setEmailOk(e.currentTarget.validity.valid && e.currentTarget.value !== "")}
            className={`${CAMPO_LOGIN} pr-10`}
            placeholder="tu@correo.com"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="password" className="eyebrow">
            Contraseña
          </label>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verClave ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${CAMPO_LOGIN} pr-10`}
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verClave}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-control text-ink-faint transition-colors hover:text-ink"
          >
            {verClave ? <IconoOjoTachado /> : <IconoOjo />}
          </button>
        </div>
      </div>

      {state.error && <Aviso tono="bad">{state.error}</Aviso>}

      <Entrar />
    </form>
  );
}
