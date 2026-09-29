"use server";

import { revalidatePath } from "next/cache";
import { markNotificationsRead } from "@/lib/api";

export async function marcarLeidas(ids?: number[]) {
  try {
    await markNotificationsRead(ids);
  } catch {
    return { error: "No se pudo marcar como leídas." };
  }
  revalidatePath("/", "layout");
  return { error: null };
}
