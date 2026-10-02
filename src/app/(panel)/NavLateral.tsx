"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoBuscar, IconoCampana, IconoCandidatos, IconoConfiguracion, IconoEdificio, IconoPanel, IconoReportes } from "@/lib/icons";
import { PANEL_ADMIN_CLIENTES_BOTS } from "@/lib/features";

type Modulo = {
  href: string;
  label: string;
  Icono: (props: { className?: string }) => React.ReactElement;
  soloAdmin: boolean;
  /** Contador a la derecha. null = sin badge. */
  contador?: number | null;
};

export function NavLateral({
  esAdmin,
  bots,
  noLeidas = 0,
}: {
  esAdmin: boolean;
  bots: number;
  noLeidas?: number;
}) {
  const pathname = usePathname();

  const modulos: Modulo[] = [
    { href: "/", label: "Home", Icono: IconoPanel, soloAdmin: false },
    {
      href: "/candidatos",
      label: "Candidatos",
      Icono: IconoCandidatos,
      soloAdmin: false,
    },
    {
      href: "/reportes",
      label: "Reportes",
      Icono: IconoReportes,
      soloAdmin: false,
    },
    {
      href: "/asistente",
      label: "Asistente",
      Icono: IconoBuscar,
      soloAdmin: false,
    },
    {
      href: "/notificaciones",
      label: "Notificaciones",
      Icono: IconoCampana,
      soloAdmin: false,
      contador: noLeidas > 0 ? noLeidas : null,
    },
    {
      href: "/configuracion",
      label: "Configuración",
      Icono: IconoConfiguracion,
      soloAdmin: false,
    },
    {
      href: "/admin",
      label: "Clientes & Bots",
      Icono: IconoEdificio,
      soloAdmin: true,
      contador: bots,
    },
  ].filter((m) => PANEL_ADMIN_CLIENTES_BOTS || m.href !== "/admin");

  return (
    <nav aria-label="Secciones" className="flex flex-col gap-1.5">
      {modulos
        .filter((m) => esAdmin || !m.soloAdmin)
        .map(({ href, label, Icono, contador }) => {
          const activo = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm pointer-coarse:py-3 font-medium transition-colors duration-150 ${
                activo
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:bg-sunk hover:text-ink"
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icono className="h-5 w-5 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
              {contador != null && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                    activo ? "bg-white/15 text-white" : "bg-sunk text-ink-soft"
                  }`}
                >
                  {contador.toLocaleString("es")}
                </span>
              )}
            </Link>
          );
        })}
    </nav>
  );
}
