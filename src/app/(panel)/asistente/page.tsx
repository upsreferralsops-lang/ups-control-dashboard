import { CoreApiError, getOpsThread, listOpsThreads } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { AsistenteSala } from "./Chat";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Asistente | Talent Ops",
};

export default async function AsistentePage({
  searchParams,
}: {
  searchParams: Promise<{ hilo?: string }>;
}) {
  await requireSession();
  const { hilo } = await searchParams;

  let error: string | null = null;
  let hilos: Awaited<ReturnType<typeof listOpsThreads>> = [];
  let detalle: Awaited<ReturnType<typeof getOpsThread>> | null = null;

  try {
    hilos = await listOpsThreads();
  } catch (caught) {
    error = caught instanceof CoreApiError ? caught.message : "No se pudo cargar el asistente.";
  }

  if (hilo && !error) {
    try {
      detalle = await getOpsThread(hilo);
    } catch (caught) {
      error = caught instanceof CoreApiError ? caught.message : "No se pudo abrir el chat.";
    }
  }

  return <AsistenteSala hilos={hilos} hiloId={hilo ?? null} detalle={detalle} error={error} />;
}
