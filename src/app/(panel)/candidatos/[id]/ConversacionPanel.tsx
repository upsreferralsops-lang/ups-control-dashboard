"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Message } from "@/lib/api";
import { timeAgo } from "@/lib/status";
import { Bloque, Boton, CAMPO } from "@/components/ui";
import { IconoAdjuntar, IconoBuscar, IconoCerrar, IconoEnviar, IconoMicrofono } from "@/lib/icons";
import { crearMejora, enviarMensaje, leerConversacion } from "./actions";

const CAPTION_CAPTURA = "Captura del referido / apply en UPS";

function mensajeConCaptura(m: Message): m is Message & { id: number | string } {
  if (m.id == null || m.id === "") return false;
  if (m.has_media) return true;
  return (m.text ?? "").trim() === CAPTION_CAPTURA;
}

/** Adjunto según su tipo: foto o captura, audio/nota de voz, o archivo. */
function AdjuntoMensaje({ m }: { m: Message & { id: number | string } }) {
  const src = `/api/media/${m.id}`;
  if (m.media_kind === "voice" || m.media_kind === "audio") {
    return (
      <audio
        controls
        // Sin el menu de los 3 puntos (descargar, velocidad, transmitir):
        // en el chat solo hace falta reproducir.
        controlsList="nodownload noplaybackrate noremoteplayback"
        preload="none"
        src={src}
        aria-label={m.media_kind === "voice" ? "Nota de voz" : (m.media_name ?? "Audio")}
        className="mb-2 h-10 w-64 max-w-full"
      />
    );
  }
  if (m.media_kind === "document") {
    return (
      <a
        href={src}
        download={m.media_name ?? true}
        className="mb-2 flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-sm font-medium text-ink underline-offset-4 hover:underline"
      >
        <IconoAdjuntar className="h-4 w-4 shrink-0 text-ink-faint" />
        <span className="truncate">{m.media_name ?? "Archivo"}</span>
      </a>
    );
  }
  return <CapturaAdjunta messageId={m.id} alt={m.media_kind === "image" ? "Foto del chat" : undefined} />;
}

function CapturaAdjunta({ messageId, alt }: { messageId: number | string; alt?: string }) {
  const [fallo, setFallo] = useState(false);
  const src = `/api/media/${messageId}`;
  if (fallo) {
    return (
      <p className="mb-2 text-xs text-bad">
        No se pudo cargar la captura.{" "}
        <a href={src} target="_blank" rel="noopener noreferrer" className="underline">
          Abrir enlace directo
        </a>
      </p>
    );
  }
  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 block"
      title="Abrir captura en tamaño completo"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt ?? "Captura del formulario de referido"}
        loading="lazy"
        decoding="async"
        className="max-h-80 w-auto rounded-control border border-line bg-surface"
        onError={() => setFallo(true)}
      />
    </a>
  );
}

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

function firmaChat(msgs: Message[]): string {
  const last = msgs.at(-1);
  return `${msgs.length}:${last?.id ?? ""}:${last?.created_at ?? ""}`;
}

export function ConversacionPanel({
  conversation,
  candidateId,
  tenantName,
  focusMessageId,
  canalLabel,
  canal,
  botPausado = false,
  puedeEscribir = false,
}: {
  conversation: Message[];
  candidateId: string;
  tenantName: string;
  focusMessageId?: number;
  canalLabel?: string;
  canal?: "telegram" | "whatsapp";
  /** HITL: el bot no le contesta; lo atiende una persona. */
  botPausado?: boolean;
  /** Solo en el hilo del propio candidato (no en el de un registro vinculado). */
  puedeEscribir?: boolean;
}) {
  const router = useRouter();
  const [msgs, setMsgs] = useState(conversation);
  const [consulta, setConsulta] = useState("");
  const [activo, setActivo] = useState(0);
  const [marcando, setMarcando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Message | null>(null);
  const [guidance, setGuidance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const listaRef = useRef<HTMLDivElement>(null);
  const firmaRef = useRef(firmaChat(conversation));

  useEffect(() => {
    const next = firmaChat(conversation);
    if (next === firmaRef.current) return;
    firmaRef.current = next;
    setMsgs(conversation);
  }, [conversation]);

  const actualizar = useCallback(async () => {
    const result = await leerConversacion(candidateId, canal);
    if (!result.ok) return;
    const next = firmaChat(result.messages);
    if (next === firmaRef.current) return;
    firmaRef.current = next;
    setMsgs(result.messages);
    router.refresh();
  }, [candidateId, canal, router]);

  // Si el SSE no llega (proxy, pestaña, Redis), el chat igual se pone al día.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState !== "hidden") void actualizar();
    }, 2000);
    return () => window.clearInterval(id);
  }, [actualizar]);

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
  }, [msgs, buscando, focusMessageId]);

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
  }, [focusMessageId, msgs, buscando]);

  const totalCoincidencias = useMemo(() => {
    if (!buscando) return 0;
    return msgs.reduce((acc, m) => acc + contarCoincidencias(m.text, q), 0);
  }, [msgs, buscando, q]);

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
    return msgs.filter((m) => contarCoincidencias(m.text, q) > 0).length;
  }, [msgs, buscando, q]);

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
                ? `0 coincidencias · ${msgs.length} mensajes`
                : `${totalCoincidencias} coincidencia${totalCoincidencias === 1 ? "" : "s"} · ${mensajesConCoincidencia} mensaje${mensajesConCoincidencia === 1 ? "" : "s"}`
              : `${msgs.length} mensajes · ${timeAgo(msgs.at(-1)?.created_at ?? null)}`}
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
      // En movil el chat ocupa la pantalla y scrollea por dentro, no la pagina entera.
      className="flex min-h-0 min-w-0 flex-col max-lg:h-[calc(100dvh-5rem)] lg:h-full"
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
        {msgs.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-soft">Todavía no hay mensajes.</p>
        )}
        {msgs.length > 0 && buscando && totalCoincidencias === 0 && (
          <p className="shrink-0 rounded-control border border-line bg-sunk px-3 py-2 text-center text-xs text-ink-soft">
            Ningún mensaje coincide con «{q}»; se muestra la conversación completa.
          </p>
        )}
        {msgs.map((m, msgIdx) => {
          const entrante = m.direction === "in";
          let indiceMarcas = 0;
          if (buscando) {
            for (let j = 0; j < msgIdx; j++) {
              indiceMarcas += contarCoincidencias(msgs[j].text, q);
            }
          }
          const { nodos } = buscando
            ? marcarTexto(m.text, q, indiceMarcas, indiceDomActivo)
            : { nodos: m.text };

          const elegido = seleccionado?.id === m.id;
          const msgDomId =
            m.id != null && m.id !== "" ? `msg-${m.id}` : undefined;
          // Escrito por una persona desde el panel: se distingue del bot.
          const humano = !entrante && Boolean(m.author_name);
          const burbuja = (
            <div
              id={msgDomId}
              className={`px-3 py-2 text-sm ${
                entrante
                  ? "rounded-r-panel rounded-tl-panel border border-line bg-sunk"
                  : humano
                    ? "rounded-l-panel rounded-tr-panel border border-signal/30 bg-signal-wash"
                    : "rounded-l-panel rounded-tr-panel border border-brand/20 bg-brand-wash"
              } ${elegido ? "ring-2 ring-signal ring-offset-1" : ""} ${
                marcando ? "cursor-pointer hover:ring-1 hover:ring-signal/50" : ""
              }`}
            >
              {mensajeConCaptura(m) && (
                <div onClick={(e) => marcando && e.preventDefault()}>
                  <AdjuntoMensaje m={m} />
                </div>
              )}
              {m.text && <p className="whitespace-pre-wrap break-words">{nodos}</p>}
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
                {entrante
                  ? "candidato"
                  : m.author_name
                    ? m.author_name
                    : m.is_automatic
                      ? "aviso automático"
                      : "bot"}{" "}
                · {timeAgo(m.created_at)}
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
            El bot le escribe ahora a este candidato. No se guarda como regla del
            bot de <strong className="text-ink-soft">{tenantName}</strong> ni se
            reutiliza en otros chats.
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

      {puedeEscribir && !marcando && !seleccionado && (
        <EscribirAlCandidato
          candidateId={candidateId}
          botPausado={botPausado}
          alEnviar={actualizar}
        />
      )}
    </Bloque>
  );
}

// Vercel corta el cuerpo de una request en 4.5 MB: se deja margen.
const TOPE_SUBIDA = 4 * 1024 * 1024;

/** Fotos grandes de celular: se achican a ~1600 px en JPEG antes de subir. */
async function achicarFoto(archivo: File): Promise<{ cuerpo: Blob; tipo: string; nombre: string }> {
  const intacto = { cuerpo: archivo as Blob, tipo: archivo.type, nombre: archivo.name };
  if (!archivo.type.startsWith("image/") || archivo.type === "image/gif" || archivo.size < 1_500_000) {
    return intacto;
  }
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    if (!blob) return intacto;
    return { cuerpo: blob, tipo: "image/jpeg", nombre: archivo.name.replace(/\.[^.]+$/, "") + ".jpg" };
  } catch {
    return intacto;
  }
}

/** Sube un adjunto por el proxy del panel. Devuelve el error, o null si salió. */
async function subirAdjunto(
  candidateId: string,
  cuerpo: Blob,
  tipo: string,
  nombre: string,
  { notaDeVoz = false, pie = "" }: { notaDeVoz?: boolean; pie?: string } = {},
): Promise<string | null> {
  if (cuerpo.size > TOPE_SUBIDA) return "El archivo supera los 4 MB que admite el panel.";
  const q = new URLSearchParams({ nombre });
  if (notaDeVoz) q.set("nota_de_voz", "true");
  if (pie) q.set("pie", pie);
  try {
    const r = await fetch(`/api/candidatos/${candidateId}/adjuntos?${q}`, {
      method: "POST",
      headers: { "Content-Type": tipo || "application/octet-stream" },
      body: cuerpo,
    });
    if (r.ok) return null;
    const j = (await r.json().catch(() => null)) as { detail?: string } | null;
    return typeof j?.detail === "string" ? j.detail : "No se pudo enviar el archivo.";
  } catch {
    return "No se pudo enviar el archivo. Revisá la conexión.";
  }
}

function duracion(segundos: number) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

const BOTON_ICONO =
  "grid h-10 w-10 shrink-0 place-items-center rounded-control text-ink-soft transition-colors duration-150 " +
  "hover:bg-sunk hover:text-ink disabled:opacity-40 pointer-coarse:h-11 pointer-coarse:w-11";

/**
 * HITL: una persona le escribe al candidato desde el panel: texto, foto,
 * archivo o nota de voz. Sale por el bot del cliente (Telegram no muestra
 * quién fue) y el core pausa el bot.
 */
function EscribirAlCandidato({
  candidateId,
  botPausado,
  alEnviar,
}: {
  candidateId: string;
  botPausado: boolean;
  alEnviar: () => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [grabadora, setGrabadora] = useState<MediaRecorder | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const descartarRef = useRef(false);

  // Contador mientras se graba.
  useEffect(() => {
    if (!grabadora) return;
    const inicio = Date.now();
    const id = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 500);
    return () => window.clearInterval(id);
  }, [grabadora]);

  function ajustarAlto(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function terminar(errorEnvio: string | null) {
    setEnviando(false);
    if (errorEnvio) {
      setError(errorEnvio);
      return;
    }
    setTexto("");
    setArchivo(null);
    if (areaRef.current) areaRef.current.style.height = "auto";
    await alEnviar();
  }

  async function enviar() {
    const limpio = texto.trim();
    if (enviando || (!limpio && !archivo)) return;
    setError(null);
    setEnviando(true);
    if (archivo) {
      const { cuerpo, tipo, nombre } = await achicarFoto(archivo);
      await terminar(await subirAdjunto(candidateId, cuerpo, tipo, nombre, { pie: limpio }));
      return;
    }
    const r = await enviarMensaje(candidateId, limpio);
    await terminar(r.ok ? null : r.error);
  }

  async function grabar() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Este navegador no permite grabar audio.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("No hay permiso para usar el micrófono.");
      return;
    }
    // Chrome/Android graban WebM/Opus; Safari, MP4. El core lo pasa a OGG/Opus.
    const tipo = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
    const partes: Blob[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) partes.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      setGrabadora(null);
      if (descartarRef.current || partes.length === 0) return;
      const blob = new Blob(partes, { type: rec.mimeType });
      const base = rec.mimeType.split(";")[0] || "audio/webm";
      setEnviando(true);
      void subirAdjunto(candidateId, blob, base, base.includes("mp4") ? "nota.m4a" : "nota.webm", {
        notaDeVoz: true,
      }).then(terminar);
    };
    descartarRef.current = false;
    setSegundos(0);
    rec.start();
    setGrabadora(rec);
  }

  function detener(descartar: boolean) {
    descartarRef.current = descartar;
    grabadora?.stop();
  }

  const hayAlgo = Boolean(texto.trim() || archivo);

  return (
    <form
      className="flex shrink-0 flex-col gap-1.5 border-t border-line pt-3"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar();
      }}
    >
      {!botPausado && (
        <p className="text-[11px] text-ink-faint">
          Al enviar, el bot se pausa con este candidato y lo atendés vos.
        </p>
      )}

      {archivo && (
        <div className="flex items-center gap-2 self-start rounded-control border border-line bg-sunk px-2.5 py-1.5 text-xs text-ink-soft">
          <IconoAdjuntar className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-56 truncate font-medium text-ink">{archivo.name}</span>
          <span className="tabular-nums">{(archivo.size / 1024 / 1024).toFixed(1)} MB</span>
          <button
            type="button"
            onClick={() => setArchivo(null)}
            aria-label="Quitar archivo"
            className="grid h-6 w-6 place-items-center rounded-control hover:bg-surface hover:text-ink"
          >
            <IconoCerrar className="h-3 w-3" />
          </button>
        </div>
      )}

      {grabadora ? (
        <div className="flex min-h-10 items-center gap-2">
          <span className="latido h-2.5 w-2.5 shrink-0 rounded-full bg-bad" aria-hidden />
          <span className="flex-1 text-sm tabular-nums text-ink" aria-live="polite">
            Grabando {duracion(segundos)}
          </span>
          <Boton type="button" onClick={() => detener(true)}>
            Cancelar
          </Boton>
          <Boton type="button" variante="primario" onClick={() => detener(false)}>
            <IconoEnviar className="h-4 w-4" />
            Enviar nota
          </Boton>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          <input
            ref={archivoRef}
            type="file"
            hidden
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,audio/*"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setError(null);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => archivoRef.current?.click()}
            disabled={enviando}
            aria-label="Adjuntar foto o archivo"
            title="Adjuntar foto o archivo"
            className={BOTON_ICONO}
          >
            <IconoAdjuntar className="h-5 w-5" />
          </button>
          <label htmlFor={`mensaje-${candidateId}`} className="sr-only">
            Mensaje al candidato
          </label>
          <textarea
            ref={areaRef}
            id={`mensaje-${candidateId}`}
            rows={1}
            value={texto}
            disabled={enviando}
            maxLength={archivo ? 1024 : 4000}
            placeholder={archivo ? "Agregá un texto (opcional)…" : "Escribile al candidato…"}
            onChange={(e) => {
              setTexto(e.target.value);
              ajustarAlto(e.currentTarget);
            }}
            // Enter envia tambien en el celular (lo pidieron los clientes, todos
            // con iPhone): el teclado muestra "Enviar". Shift+Enter baja de linea
            // con teclado fisico. isComposing: no cortar un dictado o autocorreccion.
            enterKeyHint="send"
            onKeyDown={(e) => {
              if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
              e.preventDefault();
              void enviar();
            }}
            className={`${CAMPO} max-h-40 min-h-10 resize-none`}
          />
          {hayAlgo ? (
            <Boton
              type="submit"
              variante="primario"
              disabled={enviando}
              aria-label="Enviar mensaje"
              className="!min-h-10 shrink-0"
            >
              <IconoEnviar className="h-4 w-4" />
              <span className="max-sm:sr-only">{enviando ? "Enviando…" : "Enviar"}</span>
            </Boton>
          ) : (
            <button
              type="button"
              onClick={() => void grabar()}
              disabled={enviando}
              aria-label="Grabar nota de voz"
              title="Grabar nota de voz"
              className={BOTON_ICONO}
            >
              <IconoMicrofono className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      {enviando && !hayAlgo && <p className="text-xs text-ink-faint">Enviando nota de voz…</p>}
      {error && <p className="text-xs text-bad">{error}</p>}
    </form>
  );
}
