"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  confirmOpsTool,
  CoreApiError,
  deleteOpsThread,
  postOpsMessage,
  rejectOpsTool,
  startOpsThread,
} from "@/lib/api";

export type AsistenteState = { error: string | null };

function mensaje(error: unknown, fallback: string): string {
  return error instanceof CoreApiError ? error.message : fallback;
}

export async function empezarConversacion(formData: FormData): Promise<AsistenteState> {
  const text = String(formData.get("text") || "").trim();
  if (!text) return { error: "Escribí un mensaje antes de enviarlo." };
  let hiloId: string;
  try {
    const hilo = await startOpsThread(text);
    hiloId = hilo.id;
  } catch (error) {
    return { error: mensaje(error, "No se pudo abrir el chat.") };
  }
  redirect(`/asistente?hilo=${hiloId}`);
}

export async function enviarMensaje(threadId: string, formData: FormData): Promise<AsistenteState> {
  const text = String(formData.get("text") || "").trim();
  if (!text) return { error: "Escribí un mensaje." };
  try {
    await postOpsMessage(threadId, text);
  } catch (error) {
    return { error: mensaje(error, "No se pudo enviar el mensaje.") };
  }
  revalidatePath("/asistente");
  return { error: null };
}

export async function borrarHilo(threadId: string): Promise<AsistenteState & { irAlInicio?: boolean }> {
  try {
    await deleteOpsThread(threadId);
  } catch (error) {
    return { error: mensaje(error, "No se pudo borrar el chat.") };
  }
  revalidatePath("/asistente");
  return { error: null, irAlInicio: true };
}

export async function confirmarAccion(threadId: string, runId: string): Promise<AsistenteState> {
  try {
    await confirmOpsTool(threadId, runId);
  } catch (error) {
    return { error: mensaje(error, "No se pudo confirmar.") };
  }
  revalidatePath("/asistente");
  return { error: null };
}

export async function cancelarAccion(threadId: string, runId: string): Promise<AsistenteState> {
  try {
    await rejectOpsTool(threadId, runId);
  } catch (error) {
    return { error: mensaje(error, "No se pudo cancelar.") };
  }
  revalidatePath("/asistente");
  return { error: null };
}
