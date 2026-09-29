"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Aviso, Boton, CAMPO } from "@/components/ui";
import { cambiarContrasena, type CambiarContrasenaState } from "@/app/actions/cambiar-contrasena";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <Boton type="submit" variante="primario" disabled={pending} className="mt-4 w-full">
      {pending ? "Guardando…" : "Guardar y entrar al panel"}
    </Boton>
  );
}

export function CambiarContrasenaForm({ email }: { email: string }) {
  const [state, formAction] = useActionState<CambiarContrasenaState, FormData>(
    cambiarContrasena,
    { error: null },
  );

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="email" value={email} />
      <div className="flex flex-col gap-2">
        <label htmlFor="current" className="eyebrow">Clave temporal</label>
        <input
          id="current"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="new" className="eyebrow">Nueva contrasena</label>
        <input
          id="new"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={CAMPO}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="repeat" className="eyebrow">Repetir nueva contrasena</label>
        <input
          id="repeat"
          name="repeat_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={CAMPO}
        />
      </div>
      {state.error ? <Aviso tono="bad">{state.error}</Aviso> : null}
      <Guardar />
    </form>
  );
}
