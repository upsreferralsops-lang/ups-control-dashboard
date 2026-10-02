"use server";

import { revalidatePath } from "next/cache";
import {
  confirmReferral,
  createImprovementCase,
  getCandidate,
  sendOperatorMessage,
  setCandidateBot,
  setImprovementCaseActive,
  type Message,
} from "@/lib/api";

function revalidarCandidato(candidateId: string) {
  revalidatePath(`/candidatos/${candidateId}`, "layout");
  revalidatePath("/candidatos");
}

/** HITL: el bot deja de contestarle a este candidato, o vuelve a hacerlo. */
export async function cambiarBot(
  candidateId: string,
  activo: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await setCandidateBot(candidateId, activo);
    revalidarCandidato(candidateId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo cambiar el estado del bot.",
    };
  }
}

/** HITL: una persona le escribe al candidato. El core pausa el bot solo. */
export async function enviarMensaje(
  candidateId: string,
  texto: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const limpio = texto.trim();
  if (!limpio) return { ok: false, error: "Escribí un mensaje." };
  try {
    await sendOperatorMessage(candidateId, limpio);
    revalidarCandidato(candidateId);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo enviar el mensaje.",
    };
  }
}

/**
 * El "ya lo referí" del operador. Es la única vía manual a sent_confirmed:
 * el bot nunca lo marca por su cuenta, porque no puede confirmar lo que pasó
 * dentro de Internal Mobility.
 */
export async function confirmarReferido(candidateId: string) {
  await confirmReferral(candidateId);
  revalidatePath(`/candidatos/${candidateId}`);
  revalidatePath(`/candidatos/${candidateId}/historial`);
  revalidatePath(`/candidatos/${candidateId}/conversacion`);
  revalidatePath("/candidatos");
  // Confirmar un referido cambia las metricas del Home (referidos_ok, etc.).
  revalidatePath("/");
}

export async function leerConversacion(
  candidateId: string,
  canal?: "telegram" | "whatsapp",
): Promise<{ ok: true; messages: Message[] } | { ok: false }> {
  try {
    const detalle = await getCandidate(candidateId, canal);
    return { ok: true, messages: detalle.conversation };
  } catch {
    return { ok: false };
  }
}

/** Correccion humana anclada a un mensaje: regla solo para el tenant del candidato. */
export async function crearMejora(
  candidateId: string,
  messageId: number,
  guidance: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await createImprovementCase(candidateId, {
      message_id: messageId,
      guidance: guidance.trim(),
    });
    revalidatePath(`/candidatos/${candidateId}`);
    revalidatePath(`/candidatos/${candidateId}/historial`);
    revalidatePath(`/candidatos/${candidateId}/conversacion`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo guardar la correccion.",
    };
  }
}

export async function cambiarEstadoMejora(
  candidateId: string,
  caseId: string,
  active: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await setImprovementCaseActive(candidateId, caseId, active);
    revalidatePath(`/candidatos/${candidateId}`);
    revalidatePath(`/candidatos/${candidateId}/historial`);
    revalidatePath(`/candidatos/${candidateId}/conversacion`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo actualizar el caso.",
    };
  }
}
