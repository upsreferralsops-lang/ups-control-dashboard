"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FiltrosHistorial, FiltroHistorialTipo } from "@/lib/historial-aplicaciones";
import { historialQueryString } from "@/lib/historial-aplicaciones";
import { CAMPO } from "@/components/ui";
import { IconoBuscar, IconoCerrar } from "@/lib/icons";

function basePath(candidateId: string) {
  return `/candidatos/${candidateId}/historial`;
}

export function HistorialFiltros({
  candidateId,
  filtros,
}: {
  candidateId: string;
  filtros: FiltrosHistorial;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState(filtros.q);
  const [pendiente, iniciar] = useTransition();
  const montado = useRef(false);

  useEffect(() => {
    setTexto(filtros.q);
  }, [filtros.q]);

  useEffect(() => {
    if (!montado.current) {
      montado.current = true;
      return;
    }
    const id = setTimeout(() => {
      iniciar(() => {
        router.replace(
          `${basePath(candidateId)}${historialQueryString(filtros, { q: texto.trim(), pagina: 1 })}`,
          { scroll: false },
        );
      });
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  const ir = (patch: Partial<FiltrosHistorial>) => {
    iniciar(() => {
      router.replace(`${basePath(candidateId)}${historialQueryString(filtros, patch)}`, {
        scroll: false,
      });
    });
  };

  const limpiar = () => {
    setTexto("");
    iniciar(() => router.replace(basePath(candidateId), { scroll: false }));
  };

  const tipo = filtros.tipo;

  return (
    <div className="flex flex-col gap-3 rounded-panel border border-line bg-surface px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="historial-q" className="eyebrow">
          Buscar
        </label>
        <div className="relative mt-1">
          <IconoBuscar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id="historial-q"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Título, ubicación, estado…"
            className={`${CAMPO} pl-9 pr-9`}
            autoComplete="off"
          />
          {texto ? (
            <button
              type="button"
              onClick={limpiar}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-control p-0.5 text-ink-faint hover:text-ink"
              aria-label="Limpiar búsqueda"
            >
              <IconoCerrar className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="historial-tipo" className="eyebrow">
          Tipo
        </label>
        <select
          id="historial-tipo"
          value={tipo}
          onChange={(e) =>
            ir({ tipo: e.target.value as FiltroHistorialTipo, pagina: 1 })
          }
          className={`${CAMPO} mt-1 min-w-[10rem]`}
          disabled={pendiente}
        >
          <option value="todos">Todos</option>
          <option value="exitosa">Aplicación exitosa</option>
          <option value="fallida">Referido fallido</option>
          <option value="seguimiento">Seguimiento</option>
        </select>
      </div>

      {pendiente ? (
        <p className="pb-2 text-xs text-ink-faint" aria-live="polite">
          Filtrando…
        </p>
      ) : null}
    </div>
  );
}
