"use server";

import { revalidatePath } from "next/cache";
import {
  assignTenants,
  CoreApiError,
  createUser,
  deleteTenant,
  setTenantActive,
  type Role,
} from "@/lib/api";

export type AdminState = { error: string | null; ok: string | null };

export async function crearUsuario(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "client") as Role;
  // Los checkboxes de bots viajan con el mismo name, de ahi el getAll.
  const tenantIds = formData.getAll("tenant_ids").map(String).filter(Boolean);

  if (password.length < 8) {
    return { error: "La contraseña necesita al menos 8 caracteres.", ok: null };
  }
  // Un cliente sin bots entra al panel y no ve nada. Es un error de carga, no
  // un estado util, asi que se corta aca. Un admin ve todo y no necesita.
  if (role === "client" && tenantIds.length === 0) {
    return { error: "Elegí al menos un bot: sin bots el cliente no ve nada.", ok: null };
  }

  try {
    await createUser({
      email,
      password,
      name: name || undefined,
      role,
      // Un admin ve todos los bots por rol: asignarle algunos no significa nada.
      tenant_ids: role === "admin" ? [] : tenantIds,
    });
  } catch (error) {
    return {
      error: error instanceof CoreApiError ? error.message : "No se pudo crear el usuario.",
      ok: null,
    };
  }

  revalidatePath("/admin");
  const conBots = role === "admin" ? "Ve todos los bots por ser administrador." : "";
  return { error: null, ok: `Usuario ${email} creado. ${conBots}`.trim() };
}

/** Reemplaza la asignación completa: lo que no viene marcado se quita. */
export async function guardarBots(userId: string, tenantIds: string[]) {
  await assignTenants(userId, tenantIds);
  revalidatePath("/admin");
}

/**
 * Baja o alta de un bot. La baja es la operación normal: el webhook rechaza
 * los tenants inactivos, así que deja de entrar tráfico sin tocar el historial.
 */
export async function cambiarEstadoBot(tenantId: string, active: boolean) {
  await setTenantActive(tenantId, active);
  revalidatePath("/admin");
}

/**
 * Borrado real. El core lo rechaza con 409 si el bot ya tiene candidatos,
 * porque eso se llevaría puestas sus conversaciones. Devuelve el mensaje del
 * core para que la pantalla explique por qué no se pudo.
 */
export async function borrarBot(tenantId: string): Promise<{ error: string | null }> {
  try {
    await deleteTenant(tenantId);
  } catch (error) {
    return {
      error: error instanceof CoreApiError ? error.message : "No se pudo borrar el bot.",
    };
  }
  revalidatePath("/admin");
  return { error: null };
}
