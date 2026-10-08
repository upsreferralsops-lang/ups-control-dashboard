"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoCampana, IconoCamion, IconoCerrar, IconoMenu } from "@/lib/icons";

/**
 * Barra lateral del panel. Desde md es la columna fija de siempre; en movil se
 * esconde detras de una barra superior con ☰ y se abre como drawer.
 * El contenido (logo, navegacion, sesion) llega como children desde el layout.
 */
export function MenuMovil({ noLeidas, children }: { noLeidas: number; children: React.ReactNode }) {
  // Se guarda la ruta en la que se abrio: al navegar a otra, queda cerrado solo.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const pathname = usePathname();
  const abierto = abiertoEn === pathname;
  const botonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  function cerrar() {
    setAbiertoEn(null);
    botonRef.current?.focus();
  }

  useEffect(() => {
    if (!abierto) return;
    // Lo de atras no scrollea ni recibe foco mientras el drawer esta abierto.
    const fondo = [document.documentElement];
    const inertes = [document.getElementById("contenido"), document.getElementById("barra-movil")];
    fondo.forEach((el) => (el.style.overflow = "hidden"));
    inertes.forEach((el) => el?.setAttribute("inert", ""));
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setAbiertoEn(null);
      botonRef.current?.focus();
    };
    document.addEventListener("keydown", alTeclear);
    return () => {
      fondo.forEach((el) => (el.style.overflow = ""));
      inertes.forEach((el) => el?.removeAttribute("inert"));
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  return (
    <>
      <header
        id="barra-movil"
        className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 md:hidden"
      >
        <button
          ref={botonRef}
          type="button"
          onClick={() => setAbiertoEn(pathname)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="menu-lateral"
          className="grid h-11 w-11 place-items-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
        >
          <IconoMenu className="h-6 w-6" />
        </button>

        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-control px-1">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand">
            <IconoCamion className="h-5 w-5 text-[#fe932c]" />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-brand">
            Talent Ops
          </span>
        </Link>

        <Link
          href="/notificaciones"
          aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
          className="relative grid h-11 w-11 place-items-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink"
        >
          <IconoCampana className="h-6 w-6" />
          {noLeidas > 0 && (
            <span
              aria-hidden
              className="absolute right-1 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-signal px-1 text-[10px] font-semibold tabular-nums text-white"
            >
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </Link>
      </header>

      <div
        aria-hidden
        onClick={cerrar}
        className={`fixed inset-0 z-30 bg-ink/40 transition-opacity duration-200 md:hidden ${
          abierto ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        ref={panelRef}
        id="menu-lateral"
        aria-label="Menú"
        // Tocar un link (aunque sea el de la pagina actual) cierra el drawer.
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setAbiertoEn(null);
        }}
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col justify-between border-r border-line bg-surface transition-[translate,visibility] duration-200 ease-out max-md:overflow-y-auto md:static md:z-10 md:h-dvh md:w-64 md:max-w-none md:shrink-0 md:translate-x-0 md:shadow-none md:transition-none ${
          abierto ? "translate-x-0 shadow-xl" : "max-md:invisible max-md:-translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar menú"
          className="absolute right-2 top-2.5 z-10 grid h-11 w-11 place-items-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink md:hidden"
        >
          <IconoCerrar className="h-5 w-5" />
        </button>
        {children}
      </aside>
    </>
  );
}
