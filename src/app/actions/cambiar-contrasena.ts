"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { changePassword, CoreApiError, SESSION_COOKIE } from "@/lib/api";

export type CambiarContrasenaState = { error: string | null };

export async function cambiarContrasena(
  _prev: CambiarContrasenaState,
  formData: FormData,
): Promise<CambiarContrasenaState> {
  const current = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const repeat = String(formData.get("repeat_password") ?? "");

  if (newPassword.length < 8) {
    return { error: "La nueva contrasena necesita al menos 8 caracteres." };
  }
  if (newPassword !== repeat) {
    return { error: "Las contrasenas nuevas no coinciden." };
  }

  try {
    const data = await changePassword(current, newPassword);
    (await cookies()).set(SESSION_COOKIE, data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  } catch (error) {
    if (error instanceof CoreApiError) return { error: error.message };
    return { error: "No se pudo actualizar la contrasena." };
  }

  redirect("/");
}
