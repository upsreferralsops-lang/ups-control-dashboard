"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CoreApiError, impersonateUser, SESSION_COOKIE, stopImpersonation } from "@/lib/api";

async function guardarTokenSesion(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function impersonarUsuario(userId: string): Promise<{ ok: false; error: string } | void> {
  try {
    const { token } = await impersonateUser(userId);
    await guardarTokenSesion(token);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof CoreApiError ? error.message : "No se pudo cambiar de vista.",
    };
  }
  redirect("/");
}

export async function volverVistaAdmin(): Promise<{ ok: false; error: string } | void> {
  try {
    const { token } = await stopImpersonation();
    await guardarTokenSesion(token);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof CoreApiError ? error.message : "No se pudo volver a administrador.",
    };
  }
  redirect("/");
}

export async function salirImpersonacion(): Promise<void> {
  try {
    const { token } = await stopImpersonation();
    await guardarTokenSesion(token);
  } catch {
    (await cookies()).delete(SESSION_COOKIE);
    redirect("/login");
  }
  redirect("/");
}
