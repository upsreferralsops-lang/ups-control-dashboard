"use server";

import { revalidatePath } from "next/cache";
import { assignTenants, CoreApiError, createUser, type Role } from "@/lib/api";

export type AdminState = { error: string | null; ok: string | null };

export async function crearUsuario(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "client") as Role;

  if (password.length < 8) {
    return { error: "La contraseña necesita al menos 8 caracteres.", ok: null };
  }

  try {
    await createUser({ email, password, name: name || undefined, role });
  } catch (error) {
    return {
      error: error instanceof CoreApiError ? error.message : "No se pudo crear el usuario.",
      ok: null,
    };
  }

  revalidatePath("/admin");
  return { error: null, ok: `Usuario ${email} creado.` };
}

/** Reemplaza la asignación completa: lo que no viene marcado se quita. */
export async function guardarBots(userId: string, tenantIds: string[]) {
  await assignTenants(userId, tenantIds);
  revalidatePath("/admin");
}
