"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconoChevron } from "@/lib/icons";

/**
 * Acota el Home a un cliente. El valor va en la URL (?cliente=<id>) para que
 * la vista sea compartible y la vuelva a resolver el server component: el
 * alcance lo decide el core, no el navegador.
 */
export function SelectorCliente({
  opciones,
  actual,
  ruta = "/",
  mostrarTodos = true,
}: {
  opciones: { id: string; nombre: string }[];
  actual: string;
  /** Ruta que conserva el filtro ?cliente=. */
  ruta?: string;
  /** Home puede ver todos. Configuración siempre elige un bot. */
  mostrarTodos?: boolean;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <div className="relative inline-block">
      <select
        aria-label={mostrarTodos ? "Filtrar por cliente" : "Elegir cliente"}
        value={actual}
        disabled={pendiente}
        onChange={(e) =>
          iniciar(() =>
            router.push(e.target.value ? `${ruta}?cliente=${e.target.value}` : ruta),
          )
        }
        className="cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface py-2 pl-3.5 pr-9 text-xs font-medium text-ink shadow-sm transition-colors hover:border-ink-faint focus:outline-none focus:ring-2 focus:ring-signal/40 disabled:opacity-60"
      >
        {mostrarTodos ? (
          <option value="">Todos los clientes ({opciones.length})</option>
        ) : null}
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      <IconoChevron className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}
