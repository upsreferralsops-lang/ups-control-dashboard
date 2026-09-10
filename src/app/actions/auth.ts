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
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/");
}

export async function cerrarSesion() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
