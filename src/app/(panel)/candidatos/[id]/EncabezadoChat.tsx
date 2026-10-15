"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { IconoCerrar, IconoMasOpciones, IconoVolver } from "@/lib/icons";
import { cambiarBot } from "./actions";
import { ReiniciarConversacion } from "./ReiniciarConversacion";

/** El menu ⋮ le habla al chat (ConversacionPanel) con estos eventos. */
export type AccionChat = "chat:buscar" | "chat:consulta" | "chat:cerrar-busqueda" | "chat:anterior" | "chat:marcar";

const ITEM =
  "flex w-full items-center px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-sunk disabled:opacity-50";

/**
 * Encabezado de la pestaña Conversación, como en Telegram: volver, quién es y
 * el estado del bot en una sola fila; todo lo demás va en el menú ⋮.
 */
export function EncabezadoChat({
  candidateId,
  nombre,
  pausado,
  motivoEscalada,
}: {
  candidateId: string;
  nombre: string;
  pausado: boolean;
  motivoEscalada: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  // Buscando, la fila del nombre se vuelve el buscador (como en Telegram).
  const [buscando, setBuscando] = useState(false);
  const [texto, setTexto] = useState("");
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const resumen = `/candidatos/${candidateId}`;

  function avisarAlChat(accion: AccionChat, detail?: string) {
    setAbierto(false);
    window.dispatchEvent(new CustomEvent(accion, { detail }));
  }

  function buscarTexto(valor: string) {
    setTexto(valor);
    avisarAlChat("chat:consulta", valor);
  }

  function cerrarBusqueda() {
    setBuscando(false);
    setTexto("");
    avisarAlChat("chat:cerrar-busqueda");
  }

  function cambiar() {
    setError(null);
    iniciar(async () => {
      const r = await cambiarBot(candidateId, pausado);
      if (r.ok) setAbierto(false);
      else setError(r.error);
    });
  }

  return (
    <div className="shrink-0 border-b border-line bg-paper max-md:sticky max-md:top-0 max-md:z-20 max-md:-mx-5 max-md:-mt-6 max-md:px-2 sm:max-md:-mx-8 sm:max-md:-mt-8 md:-mt-2 md:pb-2">
      {buscando ? (
        <div className="flex min-h-14 items-center gap-1">
          <button
            type="button"
            onClick={cerrarBusqueda}
            aria-label="Cerrar búsqueda"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
          >
            <IconoVolver className="h-5 w-5" />
          </button>
          <input
            autoFocus
            type="search"
            enterKeyHint="search"
            value={texto}
            onChange={(e) => buscarTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                avisarAlChat("chat:anterior");
              } else if (e.key === "Escape") cerrarBusqueda();
            }}
            placeholder="Buscar"
            aria-label="Buscar en la conversación"
            className="h-10 min-w-0 flex-1 rounded-full border border-line bg-sunk px-4 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-brand/40 [&::-webkit-search-cancel-button]:hidden"
          />
          {texto && (
            <button
              type="button"
              onClick={() => buscarTexto("")}
              aria-label="Borrar búsqueda"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
            >
              <IconoCerrar className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
      <div className="flex min-h-14 items-center gap-1">
        <Link
          href={resumen}
          aria-label="Volver al resumen"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
        >
          <IconoVolver className="h-5 w-5" />
        </Link>

        <Link href={resumen} className="flex min-w-0 flex-1 items-center gap-3 rounded-control py-1 pr-2">
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-wash text-sm font-semibold text-brand-ink"
            aria-hidden
          >
            {nombre.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold leading-tight text-ink">{nombre}</span>
            <span
              className={`flex items-center gap-1.5 text-xs ${pausado ? "text-warn-ink" : "text-ok-ink"}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${pausado ? "bg-warn" : "bg-ok"}`} aria-hidden />
              {pausado ? "Bot pausado · lo atiendes tú" : "Bot activo"}
            </span>
          </span>
        </Link>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            aria-label="Más opciones"
            aria-haspopup="menu"
            aria-expanded={abierto}
            className="grid h-10 w-10 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
          >
            <IconoMasOpciones className="h-5 w-5" />
          </button>

          {/* Se oculta en vez de desmontarse: el diálogo de Reiniciar vive adentro. */}
          {abierto && (
            <button
              type="button"
              aria-label="Cerrar menú"
              tabIndex={-1}
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setAbierto(false)}
            />
          )}
          <div
            role="menu"
            className={`${abierto ? "" : "hidden"} absolute right-0 top-11 z-40 w-60 overflow-hidden rounded-panel border border-line bg-surface py-1 shadow-xl`}
            onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
          >
            <button type="button" role="menuitem" className={ITEM} disabled={pendiente} onClick={cambiar}>
              {pendiente ? "Guardando…" : pausado ? "Reactivar bot" : "Pausar bot"}
            </button>
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={() => {
                setBuscando(true);
                avisarAlChat("chat:buscar");
              }}
            >
              Buscar en el chat
            </button>
            <button type="button" role="menuitem" className={ITEM} onClick={() => avisarAlChat("chat:marcar")}>
              Marcar corrección
            </button>
            <div className="my-1 border-t border-line" />
            <Link role="menuitem" href={resumen} className={ITEM}>
              Ver resumen
            </Link>
            <Link role="menuitem" href={`${resumen}/historial`} className={ITEM}>
              Ver historial
            </Link>
            <div className="my-1 border-t border-line" />
            <ReiniciarConversacion candidateId={candidateId} className={`${ITEM} !text-bad`}>
              Reiniciar conversación
            </ReiniciarConversacion>
          </div>
        </div>
      </div>
      )}

      {error && <p className="px-3 pb-2 text-xs text-bad">{error}</p>}
      {pausado && motivoEscalada && (
        <p className="mx-1 mb-2 truncate rounded-control border border-warn-border bg-signal-wash px-3 py-1.5 text-xs text-signal-ink" title={motivoEscalada}>
          <strong>Pidió una persona:</strong> {motivoEscalada}
        </p>
      )}
    </div>
  );
}
