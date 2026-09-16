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
}: {
  opciones: { id: string; nombre: string }[];
  actual: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  return (
    <div className="relative inline-block">
      <select
        aria-label="Filtrar por cliente"
        value={actual}
        disabled={pendiente}
        onChange={(e) =>
          iniciar(() => router.push(e.target.value ? `/?cliente=${e.target.value}` : "/"))
        }
        className="cursor-pointer appearance-none rounded-lg border border-line-strong bg-surface py-2 pl-3.5 pr-9 text-xs font-medium text-ink shadow-sm transition-colors hover:border-ink-faint focus:outline-none focus:ring-2 focus:ring-signal/40 disabled:opacity-60"
      >
        <option value="">Todos los clientes ({opciones.length})</option>
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
