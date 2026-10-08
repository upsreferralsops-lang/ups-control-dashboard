import Link from "next/link";
import { requireSession } from "@/lib/session";
import { cargarOpcionesVista, getCredits, getNotifications, type TenantCredits } from "@/lib/api";
import { IconoCamion } from "@/lib/icons";
import { NavLateral } from "./NavLateral";
import { MenuMovil } from "./MenuMovil";
import { SseRefresh } from "@/components/SseRefresh";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import { BannerImpersonacion } from "@/components/BannerImpersonacion";
import { BannerCreditos } from "@/components/BannerCreditos";
import { PieSesion } from "@/components/PieSesion";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const { user, tenants, impersonation } = session;
  const esAdmin = user.role === "admin";
  const mostrarSwitchVista = esAdmin || impersonation != null;

  let vistaUsuarios = null;
  if (mostrarSwitchVista) {
    vistaUsuarios = await cargarOpcionesVista(session);
  }

  let alertasCreditos: TenantCredits[] = [];
  try {
    alertasCreditos = (await getCredits()).alertas;
  } catch {
    alertasCreditos = [];
  }

  let noLeidas = 0;
  try {
    noLeidas = (await getNotifications()).unread;
  } catch {
    noLeidas = 0;
  }

  const subtituloSesion = impersonation
    ? "Vista de cliente"
    : esAdmin
      ? "Admin General"
      : `${tenants.length} bot${tenants.length === 1 ? "" : "s"}`;

  return (
    // tema-fijo: el design system (DESIGN.md) no define paleta oscura, asi que
    // la consola se ve igual sin importar el tema del sistema operativo.
    <div className="tema-fijo flex min-h-dvh flex-col bg-paper md:h-dvh md:flex-row md:overflow-hidden">
      <SseRefresh userId={user.id} />
      <RegistrarServiceWorker />
      <a
        href="#contenido"
        className="saltar-al-contenido rounded-control bg-brand px-3 py-2 text-sm text-white"
      >
        Saltar al contenido
      </a>

      <MenuMovil noLeidas={noLeidas}>
        <div className="flex flex-col">
          <Link
            href="/"
            className="flex h-16 items-center gap-3 border-b border-line px-6 transition-opacity duration-150 hover:opacity-80 max-md:pr-14"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand">
              {/* Naranja de marca sobre el chocolate, como en el diseno. */}
              <IconoCamion className="h-5 w-5 text-[#fe932c]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold leading-tight tracking-tight text-brand">
                Talent Ops
              </span>
              <span className="truncate text-[11px] font-medium text-ink-soft">
                {esAdmin ? "Consola Administrador" : "Consola de referidos"}
              </span>
            </span>
          </Link>

          <div className="p-4">
            <NavLateral esAdmin={esAdmin} bots={tenants.length} noLeidas={noLeidas} />
          </div>
        </div>

        <div className="border-t border-line p-4">
          <PieSesion
            user={user}
            subtitulo={subtituloSesion}
            vista={vistaUsuarios}
            mostrarSwitch={mostrarSwitchVista}
          />
        </div>
      </MenuMovil>

      <main
        id="contenido"
        className="flex w-full min-w-0 flex-1 flex-col gap-8 max-md:overflow-x-clip md:overflow-x-hidden md:overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 md:min-h-0 [&>*:not([data-fill-panel])]:shrink-0"
      >
        {impersonation && <BannerImpersonacion user={user} impersonation={impersonation} />}
        {!esAdmin && <BannerCreditos alertas={alertasCreditos} />}
        {children}
      </main>
    </div>
  );
}
