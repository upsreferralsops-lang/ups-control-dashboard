"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CAMPO } from "@/components/ui";
import type { ReferralStatus } from "@/lib/api";

const RANGOS = [
  { value: "30d", label: "Últimos 30 días" },
  { value: "mes", label: "Este mes" },
  { value: "mes_ant", label: "Mes anterior" },
  { value: "anio", label: "Este año" },
  { value: "todo", label: "Todo el tiempo" },
] as const;

const ESTADOS: { value: ReferralStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos los estados" },
  { value: "sent_confirmed", label: "Referidos enviados" },
  { value: "waiting_position", label: "En espera" },
  { value: "not_started", label: "En proceso de aplicación" },
  { value: "duplicate_or_error", label: "Fallidos" },
  { value: "search_failed", label: "Búsqueda falló" },
];

function ruta({
  rango,
  estado,
  bot,
}: {
  rango: string;
  estado: string;
  bot: string;
}) {
  const p = new URLSearchParams();
  if (rango && rango !== "30d") p.set("rango", rango);
  if (estado && estado !== "todos") p.set("estado", estado);
  if (bot) p.set("bot", bot);
  return p.toString() ? `/reportes?${p}` : "/reportes";
}

export function FiltrosReportes({
  rango,
  estado,
  bot,
  tenants,
  etiquetaTodos,
}: {
  rango: string;
  estado: string;
  bot: string;
  tenants: { id: string; name: string }[];
  etiquetaTodos: string;
}) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();

  const ir = (cambios: { rango?: string; estado?: string; bot?: string }) => {
    iniciar(() =>
      router.replace(
        ruta({
          rango: cambios.rango ?? rango,
          estado: cambios.estado ?? estado,
          bot: cambios.bot ?? bot,
        }),
        { scroll: false },
      ),
    );
  };

  return (
    <div
      // En movil dos por fila; si el ultimo queda solo, ocupa la fila entera.
      className={`grid min-w-0 grid-cols-2 gap-3 max-sm:[&>:last-child:nth-child(odd)]:col-span-2 sm:gap-4 ${
        tenants.length > 1 ? "sm:grid-cols-3" : "sm:grid-cols-2"
      }`}
    >
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Rango de fechas</label>
        <select
          className={CAMPO}
          value={rango}
          disabled={pendiente}
          aria-label="Rango de fechas"
          onChange={(e) => ir({ rango: e.target.value })}
        >
          {RANGOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Estado del candidato</label>
        <select
          className={CAMPO}
          value={estado}
          disabled={pendiente}
          aria-label="Estado del candidato"
          onChange={(e) => ir({ estado: e.target.value })}
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>
              {e.label}
            </option>
          ))}
        </select>
      </div>
      {tenants.length > 1 && (
        <div className="min-w-0">
          <label className="mb-1.5 block text-xs font-semibold text-ink-soft">Bot / Cliente</label>
          <select
            className={CAMPO}
            value={bot}
            disabled={pendiente}
            aria-label="Filtrar por bot"
            onChange={(e) => ir({ bot: e.target.value })}
          >
            <option value="">{etiquetaTodos}</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
