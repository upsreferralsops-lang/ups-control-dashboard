"use server";

import { revalidatePath } from "next/cache";
import { confirmReferral } from "@/lib/api";

/**
 * El "ya lo referí" del operador. Es la única vía manual a sent_confirmed:
 * el bot nunca lo marca por su cuenta, porque no puede confirmar lo que pasó
 * dentro de Internal Mobility.
 */
export async function confirmarReferido(candidateId: string) {
  await confirmReferral(candidateId);
  revalidatePath(`/candidatos/${candidateId}`);
  revalidatePath("/");
}
