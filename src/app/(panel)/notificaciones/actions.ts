"use server";

import { revalidatePath } from "next/cache";
import {
  deletePushSubscription,
  getPushPublicKey,
  markNotificationsRead,
  savePushSubscription,
  type PushSubscriptionBody,
} from "@/lib/api";

/** Clave VAPID del core; null si el push no está configurado. */
export async function clavePush(): Promise<string | null> {
  try {
    return (await getPushPublicKey()).key;
  } catch {
    return null;
  }
}

export async function guardarSuscripcion(sub: PushSubscriptionBody) {
  try {
    await savePushSubscription(sub);
    return { error: null };
  } catch {
    return { error: "No se pudo activar en este dispositivo." };
  }
}

export async function borrarSuscripcion(endpoint: string) {
  try {
    await deletePushSubscription(endpoint);
    return { error: null };
  } catch {
    return { error: "No se pudo desactivar en este dispositivo." };
  }
}

export async function marcarLeidas(ids?: number[]) {
  try {
    await markNotificationsRead(ids);
  } catch {
    return { error: "No se pudo marcar como leídas." };
  }
  revalidatePath("/", "layout");
  return { error: null };
}
