"use server";

import { revalidatePath } from "next/cache";
import {
  createTenantImprovementCase,
  deleteTenantImprovementCase,
  patchTenantImprovementCase,
  playgroundTurn,
  type PlaygroundTurn,
} from "@/lib/api";

function revalidar(tenantId: string) {
  revalidatePath("/configuracion");
  revalidatePath(`/configuracion?cliente=${tenantId}`);
}

export async function guardarBorrador(
  tenantId: string,
  body: { title: string; guidance: string; is_global?: boolean },
  caseId?: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const guidance = body.guidance.trim();
    const title = body.title.trim();
    const extra = body.is_global === undefined ? {} : { is_global: body.is_global };
    if (caseId) {
      const row = await patchTenantImprovementCase(tenantId, caseId, {
        guidance,
        title,
        ...extra,
      });
      revalidar(tenantId);
      return { ok: true, id: row.id };
    }
    const row = await createTenantImprovementCase(tenantId, {
      guidance,
      title: title || undefined,
      ...extra,
    });
    revalidar(tenantId);
    return { ok: true, id: row.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo guardar el borrador.",
    };
  }
}

export async function habilitarRegla(
  tenantId: string,
  caseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await patchTenantImprovementCase(tenantId, caseId, { published: true, active: true });
    revalidar(tenantId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo habilitar la regla.",
    };
  }
}

export async function borrarRegla(
  tenantId: string,
  caseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await deleteTenantImprovementCase(tenantId, caseId);
    revalidar(tenantId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo borrar la regla.",
    };
  }
}

export async function cambiarActivaRegla(
  tenantId: string,
  caseId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await patchTenantImprovementCase(tenantId, caseId, { active });
    revalidar(tenantId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar la regla.",
    };
  }
}

export async function turnoPlayground(
  tenantId: string,
  body: {
    message: string;
    session_id?: string;
  },
): Promise<{ ok: true; data: PlaygroundTurn } | { ok: false; error: string }> {
  try {
    const data = await playgroundTurn(tenantId, {
      message: body.message,
      session_id: body.session_id,
    });
    revalidar(tenantId);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo probar el bot.",
    };
  }
}
