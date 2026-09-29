"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ImprovementCase, PlaygroundMessage } from "@/lib/api";
import { Aviso, Boton, CAMPO } from "@/components/ui";
import { IconoEnviar } from "@/lib/icons";
import {
  cambiarActivaRegla,
  guardarBorrador,
  habilitarRegla,
  turnoPlayground,
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

  const [nombre, setNombre] = useState("Alex");
  const [zip, setZip] = useState("32824");
  const [mensaje, setMensaje] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [chat, setChat] = useState<PlaygroundMessage[]>([]);
  const [probando, setProbando] = useState(false);

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

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="flex min-h-0 flex-col rounded-panel border border-line bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex items-center gap-1 rounded-control bg-sunk p-0.5">
            <button
              type="button"
              onClick={() => {
                setPestana("reglas");
                abrir(reglas[0] ?? "nueva");
              }}
              className={`rounded-control px-2.5 py-1 text-xs font-semibold ${
                pestana === "reglas" ? "bg-surface text-ink shadow-sm" : "text-ink-soft"
              }`}
            >
              Reglas · {reglas.length}
            </button>
            <button
              type="button"
              onClick={() => {
                setPestana("correcciones");
                const primera = correcciones[0];
                if (primera) abrir(primera);
                else setSeleccion(null);
              }}
              className={`rounded-control px-2.5 py-1 text-xs font-semibold ${
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
              onClick={() => abrir("nueva")}
            >
              Nueva regla
            </Boton>
          ) : null}
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
          <ul className="max-h-56 overflow-y-auto border-b border-line md:max-h-none md:border-b-0 md:border-r">
            {listado.length === 0 ? (
              <li className="px-4 py-6 text-sm text-ink-soft">
                {pestana === "reglas"
                  ? `Todavía no hay reglas para ${tenantName}.`
                  : "Todavía no hay correcciones de un chat. Se crean con «Marcar corrección»."}
              </li>
            ) : (
              listado.map((caso) => {
                const activo = seleccion === caso.id;
                return (
                  <li key={caso.id}>
                    <button
                      type="button"
                      onClick={() => abrir(caso)}
                      className={`flex w-full flex-col items-start gap-1 px-4 py-3 text-left text-sm transition-colors duration-150 ${
                        activo ? "bg-brand-wash text-ink" : "text-ink-soft hover:bg-sunk hover:text-ink"
                      }`}
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
                  </li>
                );
              })
            )}
          </ul>

          {pestana === "correcciones" ? (
            <div className="flex min-h-0 flex-col gap-3 p-4">
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
            className="flex min-h-0 flex-col gap-3 p-4"
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
                Probá esta regla en el playground para poder habilitarla.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
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

      <section className="flex min-h-[40vh] flex-col rounded-panel border border-line bg-surface lg:min-h-0">
        <header className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Playground</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Esto no le llega a ningún candidato. Guardá el borrador para que entre en la prueba; el
            bot responde con las reglas habilitadas y tus borradores.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 border-b border-line px-4 py-3">
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">Nombre de prueba</span>
            <input
              className={CAMPO}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">ZIP</span>
            <input
              className={`${CAMPO} tabular-nums`}
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              inputMode="numeric"
            />
          </label>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
          {chat.length === 0 && !probando ? (
            <p className="m-auto max-w-prose text-center text-sm text-ink-soft">
              Escribí como un candidato para ver cómo responde el bot con las reglas nuevas.
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

        <form
          className="flex gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const texto = mensaje.trim();
            if (!texto || probando) return;
            setError(null);
            setProbando(true);
            setMensaje("");
            void (async () => {
              const result = await turnoPlayground(tenantId, {
                message: texto,
                session_id: sessionId,
                first_name: nombre,
                zip,
              });
              setProbando(false);
              if (!result.ok) {
                setError(result.error);
                setMensaje(texto);
                return;
              }
              setSessionId(result.data.session_id);
              setChat(result.data.messages);
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
            placeholder="Escribí como un candidato…"
            disabled={probando}
          />
          <Boton type="submit" variante="primario" disabled={probando || !mensaje.trim()}>
            <IconoEnviar className="h-4 w-4" />
            Probar
          </Boton>
        </form>
      </section>
    </div>
  );
}
