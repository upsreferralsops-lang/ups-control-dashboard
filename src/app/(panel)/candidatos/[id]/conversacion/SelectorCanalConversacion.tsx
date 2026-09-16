"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { ConversationChannelView } from "@/lib/api";
import { IconoConversacion, IconoEnviar } from "@/lib/icons";

const META = {
  whatsapp: {
    label: "WhatsApp",
    Icono: IconoConversacion,
    activo: "border-ok-border bg-ok-wash/80 ring-2 ring-ok-border/40",
    inactivo: "border-line bg-surface hover:border-ok-border/50 hover:bg-ok-wash/30",
    acento: "text-ok-ink",
  },
  telegram: {
    label: "Telegram",
    Icono: IconoEnviar,
    activo: "border-brand/35 bg-brand-wash ring-2 ring-brand/15",
    inactivo: "border-line bg-surface hover:border-brand/25 hover:bg-brand-wash/50",
    acento: "text-brand",
  },
} as const;

export function SelectorCanalConversacion({
  candidateId,
  canales,
  canalActivo,
}: {
  candidateId: string;
  canales: ConversationChannelView[];
  canalActivo: "telegram" | "whatsapp";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pendiente, iniciar] = useTransition();

  const ir = (canal: "telegram" | "whatsapp") => {
    if (canal === canalActivo) return;
    const next = new URLSearchParams(params.toString());
    next.set("canal", canal);
    next.delete("mensaje");
    iniciar(() => {
      router.replace(`/candidatos/${candidateId}/conversacion?${next.toString()}`, {
        scroll: false,
      });
    });
  };

  return (
    <div
      className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2"
      role="tablist"
      aria-label="Canal de conversación"
    >
      {canales.map((v) => {
        const meta = META[v.channel];
        const seleccionado = v.channel === canalActivo;
        const sinHilo = !v.candidate_id;
        return (
          <button
            key={v.channel}
            type="button"
            role="tab"
            aria-selected={seleccionado}
            disabled={pendiente}
            onClick={() => ir(v.channel)}
            className={[
              "flex items-start gap-3 rounded-panel border px-4 py-3 text-left transition-colors duration-150",
              seleccionado ? meta.activo : meta.inactivo,
              pendiente ? "opacity-70" : "",
            ].join(" ")}
          >
            <span
              className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-control border border-line/60 bg-surface ${meta.acento}`}
            >
              <meta.Icono className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-ink">{meta.label}</span>
                {v.linked_record ? (
                  <span className="rounded-full bg-signal-wash px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-ink">
                    registro vinculado
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm text-ink-soft">
                {sinHilo
                  ? "Sin conversación en este canal todavía."
                  : `${v.message_count} mensaje${v.message_count === 1 ? "" : "s"}`}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
