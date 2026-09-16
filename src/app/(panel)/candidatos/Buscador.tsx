"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/lib/api";
import { CAMPO } from "@/components/ui";
import { IconoBuscar, IconoCerrar } from "@/lib/icons";

/** Arma la URL del panel conservando lo que no cambia. */
function ruta({ q, bot, estado }: { q: string; bot: string; estado: string }) {
  const p = new URLSearchParams();
  if (estado !== "todos") p.set("estado", estado);
  if (q) p.set("q", q);
  if (bot) p.set("bot", bot);
  return p.toString() ? `/candidatos?${p}` : "/candidatos";
}

/**
 * Busca mientras se escribe. La query vive en la URL (compartible, y el
 * server component vuelve a consultar), con 300ms de espera para no disparar
 * una consulta por tecla.
 *
 * Atajos: "/" enfoca el campo desde cualquier parte del panel y Escape lo
 * suelta. Es lo que espera quien pasa el dia en una consola y no quiere ir al
 * mouse para filtrar.
 */
export function Buscador({
  q,
  bot,
  estado,
  tenants,
}: {
  q: string;
  bot: string;
  estado: string;
  tenants: Tenant[];
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(q);
  const [pendiente, iniciar] = useTransition();
  const montado = useRef(false);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // En el primer render la URL ya trae este texto: no hay que navegar.
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const id = setTimeout(() => {
      iniciar(() => router.replace(ruta({ q: texto.trim(), bot, estado }), { scroll: false }));
    }, 300);
    return () => clearTimeout(id);
    // bot y estado no van en las dependencias: los cambia una navegacion, no este efecto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      // Si ya se esta escribiendo en algun control, "/" es un caracter mas.
      const enControl =
        document.activeElement instanceof HTMLElement &&
        ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
      if (e.key === "/" && !enControl) {
        e.preventDefault();
        campo.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === campo.current) {
        campo.current?.blur();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, []);

  const limpiar = () => {
    setTexto("");
    router.replace(ruta({ q: "", bot: "", estado }), { scroll: false });
    campo.current?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-64 flex-1">
        <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          ref={campo}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Nombre, correo, teléfono, posición, estado o usuario"
          aria-label="Buscar candidatos"
          // 16px en movil: por debajo, Safari hace zoom al enfocar.
          className={`${CAMPO} min-h-9 py-2 pl-9 pr-24 text-base sm:text-sm [&::-webkit-search-cancel-button]:hidden`}
        />

        <div className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {pendiente && <span className="font-mono text-[11px] text-ink-faint">buscando…</span>}
          {texto ? (
            <button
              type="button"
              onClick={limpiar}
              aria-label="Limpiar búsqueda"
              className="pointer-events-auto grid h-6 w-6 place-items-center rounded-control text-ink-faint transition-colors duration-150 hover:bg-sunk hover:text-ink"
            >
              <IconoCerrar className="h-3.5 w-3.5" />
            </button>
          ) : (
            !pendiente && (
              <kbd className="hidden rounded-control border border-line bg-sunk px-1.5 py-0.5 text-[10px] tabular-nums text-ink-faint sm:block">
                /
              </kbd>
            )
          )}
        </div>
      </div>

      {tenants.length > 1 && (
        <select
          value={bot}
          onChange={(e) =>
            iniciar(() =>
              router.replace(ruta({ q: texto.trim(), bot: e.target.value, estado }), {
                scroll: false,
              }),
            )
          }
          aria-label="Filtrar por bot"
          className={`${CAMPO} min-h-9 w-auto py-2`}
        >
          <option value="">Todos los bots</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
