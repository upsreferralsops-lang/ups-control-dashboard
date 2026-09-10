"use server";

import { revalidatePath } from "next/cache";
import { confirmReferral } from "@/lib/api";

/**
 * El "ya lo referi" del operador. Es la unica via manual para que un
 * candidato llegue a sent_confirmed -- el bot nunca lo marca por su cuenta
 * (salvaguarda: no se anuncia lo que el sistema no confirmo).
 */
export async function confirmarReferido(candidateId: string) {
  await confirmReferral(candidateId);
  revalidatePath(`/candidatos/${candidateId}`);
  revalidatePath("/");
}
