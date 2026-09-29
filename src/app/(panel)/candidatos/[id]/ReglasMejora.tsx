"use client";

import Link from "next/link";
import type { ImprovementCase } from "@/lib/api";
import { Bloque } from "@/components/ui";

export function ReglasMejora({
  candidateId,
  tenantId,
  tenantName,
  casos,
}: {
  candidateId: string;
  tenantId: string | null;
  tenantName: string;
  casos: ImprovementCase[];
}) {
  return (
    <Bloque
      titulo="Correcciones de este chat"
      extra={
        <span className="text-xs tabular-nums text-ink-faint">
          {casos.length} {casos.length === 1 ? "aviso" : "avisos"}
        </span>
      }
      className="shrink-0"
    >
      <p className="mb-3 text-xs text-ink-soft">
        Avisos puntuales de esta conversación. No se vuelven reglas del bot de{" "}
        <strong className="text-ink">{tenantName}</strong>. Las reglas permanentes se crean en{" "}
        {tenantId ? (
          <Link href={`/configuracion?cliente=${tenantId}`} className="font-semibold text-brand underline-offset-2 hover:underline">
            Configuración
          </Link>
        ) : (
          <Link href="/configuracion" className="font-semibold text-brand underline-offset-2 hover:underline">
            Configuración
          </Link>
        )}
        .
      </p>

      {casos.length === 0 ? (
        <p className="text-sm text-ink-soft">
          Todavía no hay correcciones de este chat. En la conversación usá «Marcar corrección».
        </p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {casos.map((caso) => (
            <li key={caso.id} className="rounded-control border border-line bg-sunk/40 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
                {caso.message_direction === "in" ? "ancla candidato" : "ancla bot"}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-ink-soft">«{caso.anchor_text}»</p>
              <p className="mt-1.5 text-sm text-ink">{caso.guidance}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="truncate text-[10px] text-ink-faint">
                  {caso.created_by_name || caso.created_by_email || "operador"}
                </span>
                {caso.message_id != null ? (
                  <Link
                    href={`/candidatos/${candidateId}/conversacion?mensaje=${caso.message_id}`}
                    className="inline-flex min-h-7 items-center justify-center rounded-control border border-line-strong bg-surface px-2 py-1 text-xs font-semibold text-ink-soft transition-colors duration-150 hover:border-ink-faint hover:bg-sunk hover:text-ink"
                  >
                    Ver
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Bloque>
  );
}
