import Link from "next/link";
import { requireSession } from "@/lib/session";
import { getMetrics, cargarOpcionesVista } from "@/lib/api";
import { IconoCamion } from "@/lib/icons";
import { NavLateral } from "./NavLateral";
import { SseRefresh } from "@/components/SseRefresh";
import { BannerImpersonacion } from "@/components/BannerImpersonacion";
import { PieSesion } from "@/components/PieSesion";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const { user, tenants, impersonation } = session;
  const esAdmin = user.role === "admin";
  const mostrarSwitchVista = esAdmin || impersonation != null;

  // Solo para el contador de la nav. Si el core no responde, la nav se dibuja
  // sin badge en vez de tumbar el panel entero: el error real ya lo muestra
  // la pagina de adentro, con su explicacion.
  let candidatos: number | null = null;
  try {
    candidatos = (await getMetrics()).total;
  } catch {
    candidatos = null;
  }

  let vistaUsuarios = null;
  if (mostrarSwitchVista) {
    vistaUsuarios = await cargarOpcionesVista(session);
  }

  const subtituloSesion = impersonation
    ? "Vista de cliente"
    : esAdmin
      ? "Admin General"
      : `${tenants.length} bot${tenants.length === 1 ? "" : "s"}`;

  return (
    // tema-fijo: el design system (DESIGN.md) no define paleta oscura, asi que
    // la consola se ve igual sin importar el tema del sistema operativo.
    <div className="tema-fijo flex min-h-screen flex-col bg-paper md:flex-row">
      <SseRefresh />
      <a
        href="#contenido"
        className="saltar-al-contenido rounded-control bg-brand px-3 py-2 text-sm text-white"
      >
        Saltar al contenido
      </a>

      <aside className="z-10 flex shrink-0 flex-col justify-between border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:w-64 md:border-b-0 md:border-r">
        <div className="flex flex-col">
          <Link
            href="/"
            className="flex h-16 items-center gap-3 border-b border-line px-6 transition-opacity duration-150 hover:opacity-80"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand">
              {/* Naranja de marca sobre el chocolate, como en el diseno. */}
              <IconoCamion className="h-5 w-5 text-[#fe932c]" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold leading-tight tracking-tight text-brand">
                UPS Talent Ops
              </span>
              <span className="truncate text-[11px] font-medium text-ink-soft">
                {esAdmin ? "Consola Administrador" : "Consola de referidos"}
              </span>
            </span>
          </Link>

          <div className="p-4">
            <NavLateral esAdmin={esAdmin} candidatos={candidatos} bots={tenants.length} />
          </div>
        </div>

        <div className="border-line p-4 md:border-t">
          <PieSesion
            user={user}
            subtitulo={subtituloSesion}
            vista={vistaUsuarios}
            mostrarSwitch={mostrarSwitchVista}
          />
        </div>
      </aside>

      <main
        id="contenido"
        className="flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-8 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 lg:h-screen lg:max-h-[100dvh] lg:min-h-0"
      >
        {impersonation && <BannerImpersonacion user={user} impersonation={impersonation} />}
        {children}
      </main>
    </div>
  );
}
