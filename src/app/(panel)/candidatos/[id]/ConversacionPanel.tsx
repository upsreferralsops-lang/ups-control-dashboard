"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import type { Message } from "@/lib/api";
import { timeAgo } from "@/lib/status";
import { Bloque, Boton, CAMPO } from "@/components/ui";
import { IconoBuscar, IconoCerrar } from "@/lib/icons";
import { crearMejora } from "./actions";

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Texto normalizado char a char → indice en el string original. */
function mapaNormalizado(texto: string): { norm: string; origIndex: number[] } {
  const origIndex: number[] = [];
  let norm = "";
  for (let i = 0; i < texto.length; i++) {
    const n = texto[i].normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (const c of n) {
      norm += c;
      origIndex.push(i);
    }
  }
  return { norm, origIndex };
}

function contarCoincidencias(texto: string, consulta: string): number {
  const q = consulta.trim();
  if (!q) return 0;
  const nq = normalizar(q);
  const { norm } = mapaNormalizado(texto);
  let n = 0;
  let pos = 0;
  while ((pos = norm.indexOf(nq, pos)) !== -1) {
    n++;
    pos += nq.length;
  }
  return n;
}

function marcarTexto(
  texto: string,
  consulta: string,
  indiceGlobalInicio: number,
  indiceActivo: number,
): { nodos: ReactNode; siguienteIndice: number } {
  const q = consulta.trim();
  if (!q) return { nodos: texto, siguienteIndice: indiceGlobalInicio };

  const nq = normalizar(q);
  const { norm, origIndex } = mapaNormalizado(texto);
  const partes: ReactNode[] = [];
  let glob = indiceGlobalInicio;
  let ultimoOrig = 0;
  let pos = 0;

  while (pos < norm.length) {
    const hit = norm.indexOf(nq, pos);
    if (hit === -1) {
      if (ultimoOrig < texto.length) partes.push(texto.slice(ultimoOrig));
      break;
    }
    const finNorm = hit + nq.length;
    const inicioOrig = origIndex[hit];
    const finOrig = origIndex[finNorm - 1] + 1;
    if (inicioOrig > ultimoOrig) partes.push(texto.slice(ultimoOrig, inicioOrig));
    const fragmento = texto.slice(inicioOrig, finOrig);
    const id = glob;
    const activa = id === indiceActivo;
    partes.push(
      <mark
        id={`busqueda-${id}`}
        key={`m-${id}`}
        className={
          activa
            ? "rounded-sm bg-signal/40 text-inherit ring-2 ring-signal ring-offset-1"
            : "rounded-sm bg-signal/25 text-inherit"
        }
      >
        {fragmento}
      </mark>,
    );
    glob++;
    ultimoOrig = finOrig;
    pos = finNorm;
  }

  return { nodos: partes.length ? partes : texto, siguienteIndice: glob };
}

export function ConversacionPanel({
  conversation,
  candidateId,
  tenantName,
  focusMessageId,
  canalLabel,
}: {
  conversation: Message[];
  candidateId: string;
  tenantName: string;
  focusMessageId?: number;
  canalLabel?: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const [marcando, setMarcando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Message | null>(null);
  const [guidance, setGuidance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const listaRef = useRef<HTMLDivElement>(null);

  const q = consulta.trim();
  const buscando = q.length > 0;

  // Al abrir / actualizar la ficha, ir al ultimo mensaje (no al primero).
  // Si hay busqueda activa, el scroll lo maneja el salto a coincidencias.
  useEffect(() => {
    if (buscando || focusMessageId != null) return;
    const el = listaRef.current;
    if (!el) return;
    const irAlFinal = () => {
      el.scrollTop = el.scrollHeight;
    };
    irAlFinal();
    // Doble frame: el alto flex a veces se resuelve un tick despues.
    const id = requestAnimationFrame(() => requestAnimationFrame(irAlFinal));
    return () => cancelAnimationFrame(id);
  }, [conversation, buscando, focusMessageId]);

  // Desde «Ver» en reglas de mejora: ir al mensaje anclado.
  useEffect(() => {
    if (focusMessageId == null || buscando) return;
    const el = listaRef.current;
    if (!el) return;
    const objetivo = el.querySelector<HTMLElement>(`#msg-${focusMessageId}`);
    if (!objetivo) return;
    const ir = () => objetivo.scrollIntoView({ block: "center", behavior: "smooth" });
    ir();
    const id = requestAnimationFrame(() => requestAnimationFrame(ir));
    objetivo.classList.add("ring-2", "ring-signal", "ring-offset-2");
    const t = window.setTimeout(() => {
      objetivo.classList.remove("ring-2", "ring-signal", "ring-offset-2");
    }, 2500);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(t);
    };
  }, [focusMessageId, conversation, buscando]);

  const totalCoincidencias = useMemo(() => {
    if (!buscando) return 0;
    return conversation.reduce((acc, m) => acc + contarCoincidencias(m.text, q), 0);
  }, [conversation, buscando, q]);

  // activo=0 → coincidencia mas reciente (abajo del chat); luego se sube.
  const indiceDomActivo =
    totalCoincidencias === 0 ? 0 : totalCoincidencias - 1 - activo;

  useEffect(() => {
    setActivo(0);
  }, [q]);

  useEffect(() => {
    if (!buscando || totalCoincidencias === 0) return;
    const nav = Math.min(activo, totalCoincidencias - 1);
    if (nav !== activo) setActivo(nav);
    const el = document.getElementById(`busqueda-${totalCoincidencias - 1 - nav}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activo, buscando, totalCoincidencias, q]);

  const ir = useCallback(
    (delta: number) => {
      if (totalCoincidencias === 0) return;
      // +1 = mas antigua (subir); -1 = mas reciente (bajar).
      setActivo((prev) => (prev + delta + totalCoincidencias) % totalCoincidencias);
    },
    [totalCoincidencias],
  );

  const mensajesConCoincidencia = useMemo(() => {
    if (!buscando) return 0;
    return conversation.filter((m) => contarCoincidencias(m.text, q) > 0).length;
  }, [conversation, buscando, q]);

  function cancelarMarcado() {
    setMarcando(false);
    setSeleccionado(null);
    setGuidance("");
    setError(null);
  }

  function guardarMejora() {
    if (!seleccionado) return;
    const messageId = Number(seleccionado.id);
    if (!Number.isFinite(messageId)) {
      setError("Este mensaje no tiene id; recarga la ficha.");
      return;
    }
    iniciar(async () => {
      const result = await crearMejora(candidateId, messageId, guidance);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      cancelarMarcado();
    });
  }

  return (
    <Bloque
      titulo={canalLabel ? `Conversación · ${canalLabel}` : "Conversación"}
      extra={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-ink-faint">
            {buscando
              ? totalCoincidencias === 0
                ? `0 coincidencias · ${conversation.length} mensajes`
                : `${totalCoincidencias} coincidencia${totalCoincidencias === 1 ? "" : "s"} · ${mensajesConCoincidencia} mensaje${mensajesConCoincidencia === 1 ? "" : "s"}`
              : `${conversation.length} mensajes · ${timeAgo(conversation.at(-1)?.created_at ?? null)}`}
          </span>
          <Boton
            type="button"
            variante={marcando ? "accent" : "neutro"}
            className="!min-h-7 !px-2 !py-1 text-xs"
            onClick={() => (marcando ? cancelarMarcado() : setMarcando(true))}
          >
            {marcando ? "Cancelar marcado" : "Marcar corrección"}
          </Boton>
        </div>
      }
      className="flex min-h-0 min-w-0 flex-col lg:h-full"
      cuerpoClassName="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-5"
    >
      {marcando && (
        <p className="shrink-0 rounded-control border border-warn-border bg-signal-wash px-3 py-2 text-xs text-signal-ink">
          Tocá un mensaje (candidato o bot) para anclar la corrección. La regla aplica solo al
          bot de <strong>{tenantName}</strong>, no a otros clientes.
        </p>
      )}

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <IconoBuscar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                ir(1); // mas antigua → subir en el chat
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                ir(-1); // mas reciente → bajar
              }
            }}
            placeholder="Buscar palabra en el chat…"
            aria-label="Buscar en la conversación"
            className={`${CAMPO} w-full py-2 pl-9 pr-3 sm:pr-9`}
          />
        </div>

        {buscando && (
          <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
            <span
              className="min-w-[4.5rem] text-center text-xs tabular-nums text-ink-soft"
              aria-live="polite"
            >
              {totalCoincidencias === 0
                ? "0 / 0"
                : `${activo + 1} / ${totalCoincidencias}`}
            </span>
            <button
              type="button"
              onClick={() => ir(1)}
              disabled={totalCoincidencias === 0}
              aria-label="Coincidencia más antigua"
              title="Más antigua (↑)"
              className="grid h-8 w-8 place-items-center rounded-control border border-line bg-surface text-ink-soft transition-colors hover:bg-sunk hover:text-ink disabled:opacity-40"
            >
              <span className="text-sm leading-none" aria-hidden>
                ↑
              </span>
            </button>
            <button
              type="button"
              onClick={() => ir(-1)}
              disabled={totalCoincidencias === 0}
              aria-label="Coincidencia más reciente"
              title="Más reciente (↓)"
              className="grid h-8 w-8 place-items-center rounded-control border border-line bg-surface text-ink-soft transition-colors hover:bg-sunk hover:text-ink disabled:opacity-40"
            >
              <span className="text-sm leading-none" aria-hidden>
                ↓
              </span>
            </button>
            <button
              type="button"
              onClick={() => setConsulta("")}
              aria-label="Limpiar búsqueda"
              className="grid h-8 w-8 place-items-center rounded-control text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
            >
              <IconoCerrar className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div ref={listaRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {conversation.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">Todavía no hay mensajes.</p>
        )}
        {conversation.length > 0 && buscando && totalCoincidencias === 0 && (
          <p className="shrink-0 rounded-control border border-line bg-sunk px-3 py-2 text-center text-xs text-ink-soft">
            Ningún mensaje coincide con «{q}»; se muestra la conversación completa.
          </p>
        )}
        {conversation.map((m, msgIdx) => {
          const entrante = m.direction === "in";
          let indiceMarcas = 0;
          if (buscando) {
            for (let j = 0; j < msgIdx; j++) {
              indiceMarcas += contarCoincidencias(conversation[j].text, q);
            }
          }
          const { nodos } = buscando
            ? marcarTexto(m.text, q, indiceMarcas, indiceDomActivo)
            : { nodos: m.text };

          const elegido = seleccionado?.id === m.id;
          const msgDomId =
            m.id != null && m.id !== "" ? `msg-${m.id}` : undefined;
          const burbuja = (
            <div
              id={msgDomId}
              className={`px-3 py-2 text-sm ${
                entrante
                  ? "rounded-r-panel rounded-tl-panel border border-line bg-sunk"
                  : "rounded-l-panel rounded-tr-panel border border-brand/20 bg-brand-wash"
              } ${elegido ? "ring-2 ring-signal ring-offset-1" : ""} ${
                marcando ? "cursor-pointer hover:ring-1 hover:ring-signal/50" : ""
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{nodos}</p>
            </div>
          );

          return (
            <div
              key={String(m.id ?? `${m.created_at}-${msgIdx}`)}
              className={`flex max-w-[85%] flex-col ${entrante ? "self-start" : "self-end"}`}
            >
              {marcando ? (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setSeleccionado(m);
                    setError(null);
                  }}
                >
                  {burbuja}
                </button>
              ) : (
                burbuja
              )}
              <p
                className={`mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint ${
                  entrante ? "text-left" : "text-right"
                }`}
              >
                {entrante ? "candidato" : "bot"} · {timeAgo(m.created_at)}
              </p>
            </div>
          );
        })}
      </div>

      {seleccionado && (
        <div className="shrink-0 space-y-2 border-t border-line pt-3">
          <p className="text-xs text-ink-soft">
            Mensaje anclado ({seleccionado.direction === "in" ? "candidato" : "bot"}):{" "}
            <span className="text-ink">
              {seleccionado.text.length > 140
                ? `${seleccionado.text.slice(0, 140)}…`
                : seleccionado.text}
            </span>
          </p>
          <textarea
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            rows={3}
            placeholder="Cómo debió responder o actuar el bot en este caso…"
            className={CAMPO}
            disabled={pendiente}
          />
          <p className="text-[11px] text-ink-faint">
            Se guarda como regla del cliente <strong className="text-ink-soft">{tenantName}</strong>.
            No afecta a otros bots.
          </p>
          {error && <p className="text-xs text-bad">{error}</p>}
          <div className="flex gap-2">
            <Boton
              type="button"
              variante="primario"
              disabled={pendiente || guidance.trim().length < 8}
              onClick={guardarMejora}
            >
              {pendiente ? "Guardando…" : "Guardar corrección"}
            </Boton>
            <Boton type="button" disabled={pendiente} onClick={cancelarMarcado}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </Bloque>
  );
}
