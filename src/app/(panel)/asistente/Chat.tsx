"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore, startTransition } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { OpsThread, OpsThreadDetail } from "@/lib/api";
import { IconoBasura, IconoBuscar, IconoEnviar } from "@/lib/icons";
import { Aviso } from "@/components/ui";
import {
  borrarHilo,
  cancelarAccion,
  confirmarAccion,
  empezarConversacion,
  enviarMensaje,
} from "./actions";

const SUGERENCIAS = [
  {
    etiqueta: "Reporte 30 días",
    texto: "Dame el reporte de los últimos 30 días",
  },
  {
    etiqueta: "Créditos",
    texto: "¿Cómo están los créditos de mis bots?",
  },
  {
    etiqueta: "Buscar vacantes",
    texto: "Buscar package handler a 40 millas de 55369",
  },
] as const;

function hace(iso: string | null): string {
  if (!iso) return "";
  const delta = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(delta) || delta < 0) return "";
  const min = Math.round(delta / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `${horas} h`;
  return `${Math.round(horas / 24)} d`;
}

function hora(iso: string | null): string {
  if (!iso) return "";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

/** Estilos por tipo de elemento: el mismo componente sirve para las dos
 * burbujas, pero la del usuario es fondo marrón (texto e hilos claros) y la
 * del asistente es clara (colores normales de la app). */
function componentesMarkdown(propio: boolean): Components {
  const hilo = propio ? "border-white/30" : "border-line";
  const atenuado = propio ? "text-white/75" : "text-ink-faint";
  return {
    p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
    a: ({ children, href }) => (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`underline underline-offset-2 ${propio ? "text-white" : "text-brand"}`}
      >
        {children}
      </a>
    ),
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    ul: ({ children }) => <ul className="list-disc space-y-0.5 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal space-y-0.5 pl-5">{children}</ol>,
    li: ({ children }) => <li>{children}</li>,
    code: ({ children }) => (
      <code
        className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${propio ? "bg-white/15" : "bg-sunk"}`}
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className={`overflow-x-auto rounded-control p-2.5 text-xs ${propio ? "bg-white/15" : "bg-sunk"}`}>
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto rounded-control border" style={{ borderColor: "currentColor" }}>
        <table className={`w-full border-collapse text-left text-xs ${hilo}`}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className={propio ? "bg-white/10" : "bg-sunk"}>{children}</thead>,
    th: ({ children }) => (
      <th className={`whitespace-nowrap border-b px-2.5 py-1.5 font-semibold ${hilo}`}>{children}</th>
    ),
    td: ({ children }) => <td className={`border-b px-2.5 py-1.5 align-top ${hilo}`}>{children}</td>,
    hr: () => <hr className={`my-2 border-t ${hilo}`} />,
    h1: ({ children }) => <p className="text-sm font-semibold">{children}</p>,
    h2: ({ children }) => <p className="text-sm font-semibold">{children}</p>,
    h3: ({ children }) => <p className="text-sm font-semibold">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className={`border-l-2 pl-2.5 ${atenuado} ${hilo}`}>{children}</blockquote>
    ),
  };
}

function Mensaje({ texto, propio }: { texto: string; propio: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 [&_table]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_pre]:my-1">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={componentesMarkdown(propio)}>
        {texto}
      </ReactMarkdown>
    </div>
  );
}

function preview(texto: string | null | undefined): string {
  if (!texto) return "Sin mensajes";
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > 72 ? `${limpio.slice(0, 72)}…` : limpio;
}

export function AsistenteSala({
  hilos,
  hiloId,
  detalle,
  error,
}: {
  hilos: OpsThread[];
  hiloId: string | null;
  detalle: OpsThreadDetail | null;
  error: string | null;
}) {
  // Solo en movil: chat e historial no entran juntos, se alterna con el switch.
  const [vista, setVista] = useState<"chat" | "historial">("chat");

  // Celular: ocupa toda la pantalla bajo la barra (h-14) y solo scrollea el chat.
  // Los margenes negativos anulan el padding de <main> (py-6 / sm:py-8).
  return (
    <div
      data-fill-panel
      className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-panel border border-line bg-surface shadow-[var(--lift)] max-md:-mx-5 max-md:-my-6 max-md:h-[calc(100dvh-3.5rem)] max-md:min-h-0 max-md:flex-none max-md:rounded-none max-md:border-0 max-md:shadow-none sm:max-md:-mx-8 sm:max-md:-my-8 md:min-h-0"
    >
      <div className="border-b border-line p-2 md:hidden">
        <div role="tablist" aria-label="Vista del asistente" className="flex gap-1 rounded-control bg-sunk p-0.5">
          {(
            [
              ["chat", "Chat"],
              ["historial", "Historial"],
            ] as const
          ).map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              role="tab"
              aria-selected={vista === valor}
              onClick={() => setVista(valor)}
              className={`min-h-9 flex-1 rounded-control px-3 text-sm font-semibold transition-colors duration-150 ${
                vista === valor ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[17.5rem_minmax(0,1fr)] lg:grid-cols-[19rem_minmax(0,1fr)]">
        <ListaHilos
          hilos={hilos}
          hiloId={hiloId}
          visibleEnMovil={vista === "historial"}
          alElegir={() => setVista("chat")}
        />
        <div className={`flex min-h-0 min-w-0 flex-col ${vista === "historial" ? "max-md:hidden" : ""}`}>
          <Conversacion hiloId={hiloId} detalle={detalle} error={error} />
        </div>
      </div>
    </div>
  );
}

function ListaHilos({
  hilos,
  hiloId,
  visibleEnMovil,
  alElegir,
}: {
  hilos: OpsThread[];
  hiloId: string | null;
  visibleEnMovil: boolean;
  /** Al abrir o crear un chat desde el historial, el movil vuelve a la vista de chat. */
  alElegir: () => void;
}) {
  const router = useRouter();
  const filtroId = useId();
  const [filtro, setFiltro] = useState("");
  const [borrando, setBorrando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibles = hilos.filter((item) => {
    const q = filtro.trim().toLowerCase();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      (item.last_text || "").toLowerCase().includes(q)
    );
  });

  return (
    <aside
      className={`min-h-0 flex-col border-line bg-[color-mix(in_srgb,var(--brand)_4%,var(--paper))] md:flex md:border-r ${
        visibleEnMovil ? "flex" : "hidden"
      }`}
    >
      <div className="flex flex-col gap-3 px-3 pb-2 pt-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">Conversaciones</h2>
            <p className="text-xs text-ink-faint">
              {hilos.length === 0 ? "Ninguna todavía" : `${hilos.length} guardada${hilos.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Link
            href="/asistente"
            onClick={alElegir}
            aria-current={hiloId ? undefined : "page"}
            title="Empezar un chat nuevo (no se guarda hasta que escribas)"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-brand px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50"
          >
            <span aria-hidden className="text-base leading-none">+</span>
            Nuevo
          </Link>
        </div>
        <label className="relative block">
          <span className="sr-only">Buscar chats</span>
          <IconoBuscar className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            id={filtroId}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-control border border-line bg-surface py-2 pl-8 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/30"
          />
        </label>
      </div>

      {error && (
        <p className="px-4 pb-2 text-sm text-bad-ink" role="alert">
          {error}
        </p>
      )}

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3 [scrollbar-color:var(--line-strong)_transparent]">
        {visibles.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-ink-soft">
            {filtro.trim()
              ? "Ningún chat coincide con esa búsqueda."
              : "Escribí el primer mensaje a la derecha. El chat se crea solo entonces."}
          </li>
        )}
        {visibles.map((item) => {
          const activo = item.id === hiloId;
          const confirma = borrando === item.id;
          return (
            <li key={item.id} className="group">
              {confirma ? (
                <div className="rounded-control border border-bad-border bg-bad-wash px-3 py-2.5">
                  <p className="text-sm font-medium text-bad-ink">¿Borrar esta conversación?</p>
                  <p className="mt-0.5 truncate text-xs text-ink-soft">{item.title}</p>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      className="rounded-control bg-bad px-2.5 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                      onClick={async () => {
                        const estado = await borrarHilo(item.id);
                        if (estado.error) {
                          setError(estado.error);
                          setBorrando(null);
                          return;
                        }
                        setBorrando(null);
                        startTransition(() => {
                          if (activo) router.push("/asistente");
                          else router.refresh();
                        });
                      }}
                    >
                      Borrar
                    </button>
                    <button
                      type="button"
                      className="rounded-control px-2.5 py-1.5 text-sm font-semibold text-ink-soft hover:bg-surface hover:text-ink"
                      onClick={() => setBorrando(null)}
                    >
                      Conservar
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`flex items-stretch gap-0.5 rounded-control transition-colors duration-150 ${
                    activo
                      ? "bg-surface shadow-[inset_3px_0_0_0_var(--signal)] ring-1 ring-line"
                      : "hover:bg-surface/80"
                  }`}
                >
                  <Link
                    href={`/asistente?hilo=${item.id}`}
                    onClick={alElegir}
                    aria-current={activo ? "page" : undefined}
                    className="min-w-0 flex-1 px-3 py-2.5 focus-visible:outline-none"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${activo ? "font-semibold text-ink" : "font-medium text-ink"}`}>
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[11px] tabular-nums text-ink-faint">{hace(item.updated_at)}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">{preview(item.last_text)}</span>
                  </Link>
                  <button
                    type="button"
                    aria-label={`Borrar ${item.title}`}
                    title="Borrar chat"
                    className="my-1.5 mr-1 grid h-8 w-8 shrink-0 place-items-center rounded-control text-ink-faint opacity-100 transition-colors hover:bg-bad-wash hover:text-bad-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100"
                    onClick={() => {
                      setError(null);
                      setBorrando(item.id);
                    }}
                  >
                    <IconoBasura className="h-4 w-4" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

function Conversacion({
  hiloId,
  detalle,
  error,
}: {
  hiloId: string | null;
  detalle: OpsThreadDetail | null;
  error: string | null;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const cantidad = detalle?.messages.length ?? 0;
  const pendientes = detalle?.pending.length ?? 0;

  useEffect(() => {
    const nodo = scroller.current;
    if (!nodo) return;
    nodo.scrollTo({ top: nodo.scrollHeight, behavior: "smooth" });
  }, [cantidad, pendientes, hiloId]);

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5">
        <span
          aria-hidden
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold tracking-tight text-white"
        >
          A
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold leading-tight text-ink">
            {detalle?.title ?? "Asistente operativo"}
          </h2>
          <p className="truncate text-xs text-ink-faint">
            Lee, propone y pide confirmación antes de tocar el portal o las fichas
          </p>
        </div>
      </header>

      <div
        ref={scroller}
        className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 md:px-8 [scrollbar-color:var(--line-strong)_transparent]"
      >
        {error && (
          <Aviso tono="bad" titulo="No se pudo abrir el chat">
            {error}
          </Aviso>
        )}

        {!hiloId && !error && <Bienvenida />}

        {detalle && detalle.messages.length === 0 && (
          <p className="m-auto text-sm text-ink-soft">Este chat todavía no tiene mensajes.</p>
        )}

        {detalle?.messages.map((msg, i) => {
          const propio = msg.author === "user";
          return (
            <article
              key={msg.id}
              className={`flex max-w-[min(42rem,100%)] gap-2.5 ${propio ? "ml-auto flex-row-reverse" : ""} animate-[asistente-in_220ms_ease-out]`}
              style={{ animationDelay: `${Math.min(i, 6) * 20}ms` }}
            >
              {!propio && (
                <span
                  aria-hidden
                  className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-wash text-[10px] font-bold text-brand"
                >
                  A
                </span>
              )}
              <div className={`flex min-w-0 flex-col gap-1 ${propio ? "items-end" : ""}`}>
                <div
                  className={`max-w-full px-3.5 py-2.5 text-sm ${
                    propio
                      ? "rounded-2xl rounded-br-md bg-brand text-white"
                      : "rounded-2xl rounded-bl-md border border-line bg-paper text-ink"
                  }`}
                >
                  <Mensaje texto={msg.text} propio={propio} />
                </div>
                {hora(msg.created_at) && (
                  <span className="px-1 text-[11px] tabular-nums text-ink-faint">{hora(msg.created_at)}</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {detalle?.pending.map((run) => (
        <div
          key={run.id}
          className="border-t border-warn-border bg-warn-wash px-4 py-3.5 md:px-6"
          role="region"
          aria-label="Acción pendiente de confirmación"
        >
          <p className="text-sm font-semibold text-warn-ink">Confirmá antes de continuar</p>
          <p className="mt-1 max-w-[65ch] text-sm leading-relaxed text-ink">
            {run.arguments._texto || "Revisá la acción antes de seguir."}
          </p>
          <BotonesConfirmacion threadId={detalle.id} runId={run.id} />
        </div>
      ))}

      <Composer threadId={detalle?.id ?? null} />
    </section>
  );
}

function Bienvenida() {
  return (
    <div className="m-auto flex w-full max-w-[36rem] flex-col items-center gap-7 py-8 text-center">
      <div className="relative">
        <span
          aria-hidden
          className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-lg font-bold text-white shadow-[0_10px_28px_-14px_rgb(53_28_21_/_0.55)]"
        >
          A
        </span>
        <span
          aria-hidden
          className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-surface bg-ok"
        />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-[1.65rem] font-semibold tracking-tight text-ink">¿Qué necesitás hoy?</h3>
        <p className="mx-auto max-w-[44ch] text-sm leading-relaxed text-ink-soft">
          Reportes, créditos, búsquedas de vacantes o cambios de ficha. Nada se escribe ni se avisa por
          Telegram hasta que confirmás.
        </p>
      </div>
      <div className="grid w-full gap-2 sm:grid-cols-3">
        {SUGERENCIAS.map((item) => (
          <button
            key={item.etiqueta}
            type="button"
            className="rounded-panel border border-line bg-paper px-3 py-3 text-left transition-colors duration-150 hover:border-signal hover:bg-signal-wash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/40"
            onClick={() =>
              document.dispatchEvent(new CustomEvent("asistente:sugerencia", { detail: item.texto }))
            }
          >
            <span className="block text-sm font-semibold text-ink">{item.etiqueta}</span>
            <span className="mt-1 block text-xs leading-snug text-ink-soft">{item.texto}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ajustarAlto(area: HTMLTextAreaElement) {
  area.style.height = "auto";
  area.style.height = `${Math.min(area.scrollHeight, 160)}px`;
}

function Composer({ threadId }: { threadId: string | null }) {
  const formRef = useRef<HTMLFormElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  // Los atajos de teclado solo se anuncian con mouse; en touch cortaban el placeholder.
  const conTeclado = useSyncExternalStore(
    () => () => {},
    () => matchMedia("(pointer: fine)").matches,
    () => true,
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const alElegir = (e: Event) => {
      const area = areaRef.current;
      if (!area) return;
      area.value = String((e as CustomEvent).detail);
      ajustarAlto(area);
      area.focus();
    };
    document.addEventListener("asistente:sugerencia", alElegir);
    return () => document.removeEventListener("asistente:sugerencia", alElegir);
  }, []);

  async function action(formData: FormData) {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const estado = threadId
        ? await enviarMensaje(threadId, formData)
        : await empezarConversacion(formData);
      setError(estado?.error ?? null);
      if (!estado?.error) {
        formRef.current?.reset();
        if (areaRef.current) areaRef.current.style.height = "auto";
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form ref={formRef} action={action} className="border-t border-line bg-surface px-4 py-3 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))] md:px-6">
      <div className="flex items-end gap-2 rounded-panel border border-line-strong bg-paper p-2 shadow-[inset_0_1px_0_0_rgb(255_255_255_/_0.6)] transition-[border-color,box-shadow] duration-150 focus-within:border-signal focus-within:ring-2 focus-within:ring-signal/25">
        <label className="sr-only" htmlFor="mensaje-asistente">
          Mensaje
        </label>
        <textarea
          ref={areaRef}
          id="mensaje-asistente"
          name="text"
          required
          rows={1}
          disabled={enviando}
          placeholder={
            (threadId ? "Seguí la conversación…" : "Escribí tu pedido…") +
            (conTeclado ? "  Ctrl+Enter envía · Shift+Enter baja de línea" : "")
          }
          onInput={(event) => ajustarAlto(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            if (event.ctrlKey || event.metaKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
              return;
            }
            // Enter solo no hace nada. Solo Shift+Enter baja de línea.
            if (!event.shiftKey) {
              event.preventDefault();
            }
          }}
          className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-sm leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={enviando}
          aria-label={enviando ? "Enviando" : "Enviar mensaje"}
          className="mb-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal/50 disabled:opacity-60"
        >
          <IconoEnviar className="h-4 w-4" />
        </button>
      </div>
      {error && (
        <div className="mt-3">
          <Aviso tono="bad" titulo="No se envió">
            {error}
          </Aviso>
        </div>
      )}
    </form>
  );
}

function BotonesConfirmacion({ threadId, runId }: { threadId: string; runId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function correr(accion: () => Promise<{ error: string | null }>) {
    if (ocupado) return;
    setOcupado(true);
    try {
      const estado = await accion();
      setError(estado.error);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={ocupado}
          className="rounded-control bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-ink disabled:opacity-60"
          onClick={() => correr(() => confirmarAccion(threadId, runId))}
        >
          {ocupado ? "Procesando…" : "Confirmar"}
        </button>
        <button
          type="button"
          disabled={ocupado}
          className="rounded-control border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-ink-soft hover:text-ink disabled:opacity-60"
          onClick={() => correr(() => cancelarAccion(threadId, runId))}
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-bad-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
