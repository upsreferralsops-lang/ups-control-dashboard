"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CoreApiError, login, SESION_SEGUNDOS, SESSION_COOKIE } from "@/lib/api";

export type LoginState = { error: string | null };

export async function iniciarSesion(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completa el correo y la contrasena." };
  }

  let token: string;
  let mustChange = false;
  try {
    const data = await login(email, password);
    token = data.token;
    mustChange = Boolean(data.user.must_change_password);
  } catch (error) {
    if (error instanceof CoreApiError) return { error: error.message };
    return { error: "No se pudo iniciar sesion." };
  }

  // httpOnly: el token no queda accesible desde JavaScript del navegador,
  // asi un XSS no puede robar la sesion.
  //
  // Persistente y del mismo largo que el token del core (24 h): sin maxAge la
  // cookie moria al cerrar el navegador, y en el celular eso es cada vez que se
  // cierra la app (Ricardo, 13/10). Mas no tiene sentido: el JWT vence igual.
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESION_SEGUNDOS,
  });

  redirect(mustChange ? "/cambiar-contrasena" : "/");
}

export async function cerrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
