"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ImprovementCase, PlaygroundMessage } from "@/lib/api";
import { Aviso, Boton, CAMPO } from "@/components/ui";
import { IconoActualizar, IconoBasura, IconoEnviar, IconoVolver } from "@/lib/icons";
import {
  cambiarActivaRegla,
  guardarBorrador,
  habilitarRegla,
  turnoPlayground,
  borrarRegla,
} from "./actions";

function esCorreccion(caso: ImprovementCase) {
  return caso.kind === "correction" || (caso.kind == null && caso.candidate_id != null && caso.message_id != null);
}

function etiqueta(caso: ImprovementCase) {
  if (caso.published === false) return "Borrador";
  if (!caso.active) return "Desactivada";
  return "En el bot";
}

export function BancoReglas({
  tenantId,
  tenantName,
  casos,
  esAdmin,
}: {
  tenantId: string;
  tenantName: string;
  casos: ImprovementCase[];
  esAdmin: boolean;
}) {
  const router = useRouter();
  const reglas = useMemo(() => casos.filter((c) => !esCorreccion(c)), [casos]);
  const correcciones = useMemo(() => casos.filter(esCorreccion), [casos]);
  const [pestana, setPestana] = useState<"reglas" | "correcciones">("reglas");
  const listado = pestana === "reglas" ? reglas : correcciones;
  const [seleccion, setSeleccion] = useState<string | "nueva" | null>(
    reglas[0]?.id ?? "nueva",
  );
  const [titulo, setTitulo] = useState(casos[0]?.title ?? "");
  const [guia, setGuia] = useState(casos[0]?.guidance ?? "");
  const [esGlobal, setEsGlobal] = useState(Boolean(casos[0]?.is_global));
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();
  const [aBorrar, setABorrar] = useState<ImprovementCase | null>(null);
  const [borrando, setBorrando] = useState(false);
  const dialogoRef = useRef<HTMLDialogElement>(null);

  // <dialog> nativo: foco atrapado, Esc y fondo bloqueado sin codigo propio.
  useEffect(() => {
    const d = dialogoRef.current;
    if (aBorrar && d && !d.open) d.showModal();
    if (!aBorrar && d?.open) d.close();
  }, [aBorrar]);

  const [avisoBot, setAvisoBot] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [chat, setChat] = useState<PlaygroundMessage[]>([]);
  const [probando, setProbando] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Solo en movil: reglas y playground se alternan, y la lista y el editor tambien.
  const [vista, setVista] = useState<"reglas" | "playground">("reglas");
  const [enDetalle, setEnDetalle] = useState(false);

  // La respuesta del bot queda a la vista sin tener que scrollear a mano.
  useEffect(() => {
    if (chat.length === 0 && !probando) return;
    chatRef.current?.lastElementChild?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [chat.length, probando]);

  const actual = useMemo(
    () => (seleccion && seleccion !== "nueva" ? casos.find((c) => c.id === seleccion) : undefined),
    [casos, seleccion],
  );

  function abrir(caso: ImprovementCase | "nueva") {
    setError(null);
    setAviso(null);
    if (caso === "nueva") {
      setSeleccion("nueva");
      setTitulo("");
      setGuia("");
      setEsGlobal(false);
      return;
    }
    setSeleccion(caso.id);
    setTitulo(caso.title ?? "");
    setGuia(caso.guidance);
    setEsGlobal(Boolean(caso.is_global));
  }

  const soloLectura = Boolean(
    actual?.is_global && (!esAdmin || actual.tenant_id !== tenantId),
  );
  const puedeHabilitar = Boolean(
    actual && !actual.published && actual.tested_in_playground_at && !soloLectura,
  );

  const volver = (
    <button
      type="button"
      onClick={() => setEnDetalle(false)}
      className="inline-flex items-center gap-1.5 self-start rounded-control text-sm text-ink-soft transition-colors duration-150 hover:text-ink md:hidden"
    >
      <IconoVolver className="h-3.5 w-3.5" />
      {pestana === "reglas" ? "Reglas" : "Correcciones"}
    </button>
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 max-lg:grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div role="tablist" aria-label="Vista de configuración" className="flex gap-1 rounded-control bg-sunk p-0.5 lg:hidden">
        {(
          [
            ["reglas", "Reglas"],
            ["playground", "Playground"],
          ] as const
        ).map(([valor, texto]) => (
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
            {texto}
          </button>
        ))}
      </div>

      <section
        className={`flex min-h-0 flex-col rounded-panel border border-line bg-surface ${
          vista === "playground" ? "max-lg:hidden" : ""
        }`}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1 rounded-control bg-sunk p-0.5">
            <button
              type="button"
              onClick={() => {
                setPestana("reglas");
                setEnDetalle(false);
                abrir(reglas[0] ?? "nueva");
              }}
              className={`rounded-control px-2.5 py-1 text-xs font-semibold max-md:min-h-8 max-md:px-3 max-md:text-sm ${
                pestana === "reglas" ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Reglas · {reglas.length}
            </button>
            <button
              type="button"
              onClick={() => {
                setPestana("correcciones");
                setEnDetalle(false);
                const primera = correcciones[0];
                if (primera) abrir(primera);
                else setSeleccion(null);
              }}
              className={`rounded-control px-2.5 py-1 text-xs font-semibold max-md:min-h-8 max-md:px-3 max-md:text-sm ${
                pestana === "correcciones" ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Correcciones · {correcciones.length}
            </button>
          </div>
          {pestana === "reglas" ? (
            <Boton
              type="button"
              className="!min-h-8 !px-2.5 !py-1 text-xs"
              onClick={() => {
                abrir("nueva");
                setEnDetalle(true);
              }}
            >
              Nueva regla
            </Boton>
          ) : null}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          {/* En movil la lista ocupa todo; tocar una regla abre el editor en su lugar. */}
          <ul className={`overflow-y-auto border-line md:border-r ${enDetalle ? "max-md:hidden" : ""}`}>
            {listado.length === 0 ? (
              <li className="px-4 py-6 text-sm text-ink-soft">
                {pestana === "reglas"
                  ? `Todavía no hay reglas para ${tenantName}.`
                  : "Todavía no hay correcciones de un chat. Se crean con «Marcar corrección»."}
              </li>
            ) : (
              listado.map((caso) => {
                const activo = seleccion === caso.id;
                const borrable =
                  !esCorreccion(caso) &&
                  (!caso.is_global || (esAdmin && caso.tenant_id === tenantId));
                return (
                  <li
                    key={caso.id}
                    className={`flex items-center transition-colors duration-150 ${
                      activo ? "bg-brand-wash text-ink" : "text-ink-soft hover:bg-sunk hover:text-ink"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        abrir(caso);
                        setEnDetalle(true);
                      }}
                      className="flex min-w-0 flex-1 flex-col items-start gap-1 px-4 py-3 text-left text-sm"
                    >
                      <span className="line-clamp-1 font-medium">
                        {caso.title || caso.guidance}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {esCorreccion(caso)
                          ? `${caso.candidate_name || "Candidato"} · un chat`
                          : `${caso.is_global ? "Global · En todos los bots · " : ""}${etiqueta(caso)}`}
                      </span>
                    </button>
                    {borrable ? (
                      <button
                        type="button"
                        aria-label={`Borrar regla ${caso.title || ""}`.trim()}
                        title="Borrar regla"
                        onClick={() => setABorrar(caso)}
                        className="mr-2 grid h-9 w-9 shrink-0 place-items-center rounded-control text-ink-faint transition-colors duration-150 hover:bg-bad-wash hover:text-bad-ink"
                      >
                        <IconoBasura className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>

          {pestana === "correcciones" ? (
            <div className={`flex min-h-0 flex-col gap-3 p-4 ${enDetalle ? "" : "max-md:hidden"}`}>
              {volver}
              {actual && esCorreccion(actual) ? (
                <>
                  <p className="text-xs text-ink-soft">
                    Conversación de{" "}
                    <strong className="text-ink">{actual.candidate_name || "un candidato"}</strong>
                    {actual.created_at
                      ? ` · ${new Date(actual.created_at).toLocaleString("es")}`
                      : ""}
                  </p>
                  <div>
                    <p className="mb-1 text-xs font-medium text-ink-soft">Mensaje marcado</p>
                    <p className="rounded-control border border-line bg-sunk px-3 py-2 text-sm text-ink">
                      «{actual.anchor_text}»
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-ink-soft">Corrección enviada</p>
                    <p className="text-sm text-ink">{actual.guidance}</p>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Aviso de ese chat. No queda como regla ni se reutiliza en otros candidatos.
                  </p>
                  {actual.candidate_id ? (
                    <Link
                      href={`/candidatos/${actual.candidate_id}/conversacion${
                        actual.message_id != null ? `?mensaje=${actual.message_id}` : ""
                      }`}
                      className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
                    >
                      Ver conversación
                    </Link>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-ink-soft">
                  Elegí una corrección de la lista. Se crean desde la ficha, no desde acá.
                </p>
              )}
            </div>
          ) : (
          <form
            className={`flex min-h-0 flex-col gap-3 p-4 ${enDetalle ? "" : "max-md:hidden"}`}
            onSubmit={(e) => {
              e.preventDefault();
              if (soloLectura) return;
              setError(null);
              setAviso(null);
              iniciar(async () => {
                const result = await guardarBorrador(
                  tenantId,
                  {
                    title: titulo,
                    guidance: guia,
                    ...(esAdmin ? { is_global: esGlobal } : {}),
                  },
                  actual?.id,
                );
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setSeleccion(result.id);
                setAviso("Borrador guardado.");
                router.refresh();
              });
            }}
          >
            {volver}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-soft">Título</span>
              <input
                className={CAMPO}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. No inventar horarios"
                maxLength={120}
                readOnly={soloLectura}
              />
            </label>
            <label className="flex min-h-0 flex-1 flex-col">
              <span className="mb-1 block text-xs font-medium text-ink-soft">
                Cómo debe actuar el bot
              </span>
              <textarea
                className={`${CAMPO} min-h-36 flex-1 resize-y`}
                value={guia}
                onChange={(e) => setGuia(e.target.value)}
                required
                minLength={8}
                placeholder="Describí cómo debe actuar el bot en una o dos frases."
                readOnly={soloLectura}
              />
            </label>
            {soloLectura ? (
              <p className="text-xs text-ink-soft">
                Réplica en solo lectura. Se edita desde el bot donde se creó; acá
                no se cambia.
              </p>
            ) : esAdmin ? (
              <label className="flex items-start gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={esGlobal}
                  onChange={(e) => setEsGlobal(e.target.checked)}
                />
                <span>
                  <span className="font-medium">Aplicar a todos los bots</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    Los demás la ven en solo lectura. El bot real la usa cuando
                    la habilites.
                  </span>
                </span>
              </label>
            ) : null}

            {error ? (
              <Aviso tono="bad">{error}</Aviso>
            ) : aviso ? (
              <p className="text-xs text-ok-ink">{aviso}</p>
            ) : null}

            {!soloLectura && !actual?.published && actual && !actual.tested_in_playground_at ? (
              <p className="text-xs text-ink-soft">
                Probá esta regla en el playground para poder habilitarla.{" "}
                <button
                  type="button"
                  onClick={() => setVista("playground")}
                  className="font-semibold text-brand underline-offset-2 hover:underline lg:hidden"
                >
                  Abrir playground
                </button>
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 max-sm:flex-col">
              {soloLectura ? null : (
              <Boton type="submit" variante="primario" disabled={pendiente || guia.trim().length < 8}>
                Guardar borrador
              </Boton>
              )}
              {actual && !actual.published && !soloLectura ? (
                <Boton
                  type="button"
                  variante="ok"
                  disabled={pendiente || !puedeHabilitar}
                  onClick={() => {
                    setError(null);
                    setAviso(null);
                    iniciar(async () => {
                      const result = await habilitarRegla(tenantId, actual.id);
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      setAviso("Habilitada para el bot.");
                      router.refresh();
                    });
                  }}
                >
                  Habilitar para el bot
                </Boton>
              ) : null}
              {actual?.published && !soloLectura ? (
                <Boton
                  type="button"
                  disabled={pendiente}
                  onClick={() => {
                    setError(null);
                    setAviso(null);
                    iniciar(async () => {
                      const result = await cambiarActivaRegla(
                        tenantId,
                        actual.id,
                        !actual.active,
                      );
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      setAviso(actual.active ? "Regla desactivada." : "Regla activada.");
                      router.refresh();
                    });
                  }}
                >
                  {actual.active ? "Desactivar regla" : "Activar regla"}
                </Boton>
              ) : null}
            </div>
          </form>
          )}
        </div>
      </section>

      <section
        className={`flex min-h-[40vh] flex-col rounded-panel border border-line bg-surface max-lg:min-h-[60dvh] max-md:min-h-[85dvh] lg:min-h-0 ${
          vista === "reglas" ? "max-lg:hidden" : ""
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-ink">Playground</h2>
            <p className="text-xs text-ink-soft">El bot real: busca vacantes, nunca refiere.</p>
          </div>
          <button
            type="button"
            aria-label="Reiniciar conversación"
            title="Reiniciar conversación"
            disabled={probando || chat.length === 0}
            onClick={() => {
              setSessionId(undefined);
              setChat([]);
              setAvisoBot(null);
              setError(null);
            }}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-line-strong bg-surface text-ink-soft transition-colors duration-150 hover:bg-sunk hover:text-ink disabled:opacity-40"
          >
            <IconoActualizar className="h-4 w-4" />
          </button>
        </header>

        <div
          ref={chatRef}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3 max-md:overflow-visible max-lg:[&>*]:scroll-mb-24"
        >
          {chat.length === 0 && !probando ? (
            <p className="m-auto max-w-prose text-center text-sm text-ink-soft">
              Escribí como un candidato nuevo.
            </p>
          ) : (
            chat.map((m) => (
              <div
                key={m.id}
                className={`max-w-[90%] rounded-control px-3 py-2 text-sm ${
                  m.direction === "in"
                    ? "self-end bg-brand text-white"
                    : "self-start border border-line bg-sunk text-ink"
                }`}
              >
                {m.text}
              </div>
            ))
          )}
          {probando ? (
            <div className="self-start h-12 w-40 animate-pulse rounded-control bg-sunk" />
          ) : null}
        </div>

        {avisoBot ? (
          <div className="px-4 pb-3">
            <Aviso>{avisoBot}</Aviso>
          </div>
        ) : null}

        {/* El error del playground se ve abajo del editor en escritorio; en movil, aca. */}
        {error ? (
          <div className="px-4 pb-3 lg:hidden">
            <Aviso tono="bad">{error}</Aviso>
          </div>
        ) : null}

        {/* En movil la caja de mensaje queda pegada abajo mientras se lee la prueba. */}
        <form
          className="flex gap-2 rounded-b-panel border-t border-line bg-surface p-3 max-lg:sticky max-lg:bottom-0 max-md:pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(e) => {
            e.preventDefault();
            const texto = mensaje.trim();
            if (!texto || probando) return;
            setError(null);
            setAvisoBot(null);
            setProbando(true);
            setMensaje("");
            void (async () => {
              const result = await turnoPlayground(tenantId, {
                message: texto,
                session_id: sessionId,
              });
              setProbando(false);
              if (!result.ok) {
                setError(result.error);
                setMensaje(texto);
                return;
              }
              setSessionId(result.data.session_id);
              setChat(result.data.messages);
              setAvisoBot(result.data.aviso);
              router.refresh();
            })();
          }}
        >
          <label className="sr-only" htmlFor="playground-msg">
            Mensaje de prueba
          </label>
          <input
            id="playground-msg"
            className={CAMPO}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            placeholder="Mensaje…"
            enterKeyHint="send"
            disabled={probando}
          />
          <Boton type="submit" variante="primario" disabled={probando || !mensaje.trim()}>
            <IconoEnviar className="h-4 w-4" />
            Probar
          </Boton>
        </form>
      </section>

      <dialog
        ref={dialogoRef}
        onClose={() => setABorrar(null)}
        aria-labelledby="borrar-regla-titulo"
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-panel border border-line bg-surface p-5 text-ink shadow-xl backdrop:bg-black/40"
      >
        <h2 id="borrar-regla-titulo" className="text-base font-semibold">
          ¿Borrar la regla?
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          «{aBorrar?.title || aBorrar?.guidance}». El bot deja de usarla. No se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Boton type="button" disabled={borrando} onClick={() => setABorrar(null)}>
            Cancelar
          </Boton>
          <button
            type="button"
            disabled={borrando}
            onClick={async () => {
              if (!aBorrar) return;
              setBorrando(true);
              const result = await borrarRegla(tenantId, aBorrar.id);
              setBorrando(false);
              if (!result.ok) {
                setError(result.error);
                setABorrar(null);
                return;
              }
              if (seleccion === aBorrar.id) {
                abrir(reglas.find((r) => r.id !== aBorrar.id) ?? "nueva");
                setEnDetalle(false);
              }
              setAviso("Regla borrada.");
              setABorrar(null);
              router.refresh();
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-control border border-transparent bg-bad px-4 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 disabled:opacity-60"
          >
            {borrando ? "Borrando…" : "Borrar"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
