"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { ImprovementCase } from "@/lib/api";
import { Bloque, Boton } from "@/components/ui";
import { cambiarEstadoMejora } from "./actions";

export function ReglasMejora({
  candidateId,
  tenantName,
  casos,
}: {
  candidateId: string;
  tenantName: string;
  casos: ImprovementCase[];
}) {
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const activos = casos.filter((c) => c.active).length;

  return (
    <Bloque
      titulo="Reglas de mejora"
      extra={
        <span className="text-xs tabular-nums text-ink-faint">
          {activos} activa{activos === 1 ? "" : "s"} · {casos.length} total
        </span>
      }
      className="shrink-0"
    >
      <p className="mb-3 text-xs text-ink-soft">
        Correcciones del equipo para el bot de <strong className="text-ink">{tenantName}</strong>.
        No se aplican a otros clientes.
      </p>

      {casos.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Todavía no hay correcciones. En la conversación usá «Marcar corrección».
        </p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {casos.map((caso) => (
            <li
              key={caso.id}
              className={`rounded-control border px-3 py-2 ${
                caso.active ? "border-line bg-sunk/40" : "border-line bg-surface opacity-60"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                {caso.message_direction === "in" ? "ancla candidato" : "ancla bot"}
                {!caso.active && " · inactiva"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-soft">«{caso.anchor_text}»</p>
              <p className="mt-1.5 text-sm text-ink">{caso.guidance}</p>
              {caso.candidate_id !== candidateId && (
                <p className="mt-1 text-[10px] text-ink-faint">
                  Candidato distinto al de esta ficha
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="truncate text-[10px] text-ink-faint">
                  {caso.created_by_name || caso.created_by_email || "operador"}
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Link
                    href={`/candidatos/${caso.candidate_id}/conversacion?mensaje=${caso.message_id}`}
                    className="inline-flex min-h-7 items-center justify-center rounded-control border border-line-strong bg-surface px-2 py-1 text-xs font-semibold text-ink-soft transition-colors duration-150 hover:border-ink-faint hover:bg-sunk hover:text-ink"
                  >
                    Ver
                  </Link>
                  <Boton
                    type="button"
                    className="!min-h-7 !px-2 !py-1 text-xs"
                    disabled={pendiente}
                    onClick={() => {
                    setError(null);
                    iniciar(async () => {
                      const result = await cambiarEstadoMejora(
                        candidateId,
                        caso.id,
                        !caso.active,
                      );
                      if (!result.ok) setError(result.error);
                    });
                  }}
                  >
                    {caso.active ? "Desactivar" : "Reactivar"}
                  </Boton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-xs text-bad">{error}</p>}
    </Bloque>
  );
}
