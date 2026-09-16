"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CoreApiError, login, SESSION_COOKIE } from "@/lib/api";

export type LoginState = { error: string | null };

export async function iniciarSesion(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const recordar = formData.get("recordar") != null;

  if (!email || !password) {
    return { error: "Completa el correo y la contrasena." };
  }

  let token: string;
  try {
    ({ token } = await login(email, password));
  } catch (error) {
    if (error instanceof CoreApiError) return { error: error.message };
    return { error: "No se pudo iniciar sesion." };
  }

  // httpOnly: el token no queda accesible desde JavaScript del navegador,
  // asi un XSS no puede robar la sesion.
  //
  // "Recordar en esta estacion": sin tildar, la cookie muere al cerrar el
  // navegador; tildado dura lo mismo que el token del core (12 h). En una
  // estacion compartida esa es la diferencia entre dejar el turno abierto
  // para el siguiente o no. Mas de 12 h no tiene sentido: el JWT vence igual
  // y la sesion se veria "iniciada" hasta el primer 401.
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(recordar ? { maxAge: 60 * 60 * 12 } : {}),
  });

  redirect("/");
}

export async function cerrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
