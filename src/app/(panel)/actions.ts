"use server";

import { CoreApiError, renewTenantSession } from "@/lib/api";

export type RenovarSesionState = { error: string | null; ok: string | null };

export async function renovarSesionUps(tenantId: string): Promise<RenovarSesionState> {
  try {
    await renewTenantSession(tenantId);
  } catch (error) {
    return {
      error: error instanceof CoreApiError ? error.message : "No se pudo encolar el re-login.",
      ok: null,
    };
  }
  return {
    error: null,
    ok: "Re-login encolado. El token nuevo llega en unos minutos (UPS pide OTP).",
  };
}
