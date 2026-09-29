import { getNotifications, type NotificacionesSnapshot } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { ListaNotificaciones } from "./Lista";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notificaciones | UPS Talent Ops",
};

export default async function NotificacionesPage() {
  await requireSession();
  let datos: NotificacionesSnapshot | null = null;
  try {
    datos = await getNotifications();
  } catch {
    datos = null;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Notificaciones</h1>
      {datos ? (
        <ListaNotificaciones items={datos.items} noLeidas={datos.unread} />
      ) : (
        <Aviso tono="bad" titulo="No se pudieron cargar">
          Reintentá en unos segundos.
        </Aviso>
      )}
    </div>
  );
}
