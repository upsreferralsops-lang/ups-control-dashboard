"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FilaConocimiento } from "@/lib/api";
import { Aviso, Boton } from "@/components/ui";
import { analizarArchivo, importarFilas } from "./actions";

const TIPOS = ".xlsx,.csv,.pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.ogg,.oga,.opus,.mp3,.m4a,.wav";
// Vercel corta las peticiones en 4,5 MB y el base64 agrega un tercio.
const MAX_BYTES = 3 * 1024 * 1024;

function aBase64(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result).split(",", 2)[1] ?? "");
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(archivo);
  });
}

/**
 * Archivo -> filas propuestas -> el usuario revisa -> publica en la base del
 * bot. Un cliente publica solo en su bot; el admin elige bots o todos.
 */
export function ImportarConocimiento({
  tenantId,
  tenantName,
  esAdmin,
  bots,
  alPublicar,
}: {
  tenantId: string;
  tenantName: string;
  esAdmin: boolean;
  bots: { id: string; nombre: string }[];
  alPublicar: (mensaje: string) => void;
}) {
  const router = useRouter();
  const [filas, setFilas] = useState<(FilaConocimiento & { incluir: boolean })[]>([]);
  const [origen, setOrigen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [paraTodos, setParaTodos] = useState(false);
  const [elegidos, setElegidos] = useState<string[]>([tenantId]);

  function reiniciar() {
    setFilas([]);
    setOrigen(null);
    setError(null);
    setParaTodos(false);
    setElegidos([tenantId]);
  }

  async function leer(archivo: File) {
    setError(null);
    if (archivo.size > MAX_BYTES) {
      setError("El archivo pasa de 3 MB. Divídelo en partes más chicas.");
      return;
    }
    setCargando(true);
    try {
      const r = await analizarArchivo(tenantId, archivo.name, await aBase64(archivo));
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (r.filas.length === 0) {
        setError("No encontré preguntas y respuestas en ese archivo.");
        return;
      }
      setOrigen(r.origen);
      setFilas(r.filas.map((f) => ({ ...f, incluir: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setCargando(false);
    }
  }

  const incluidas = filas.filter((f) => f.incluir);

  async function publicar() {
    setCargando(true);
    setError(null);
    const r = await importarFilas(tenantId, {
      filas: incluidas.map(({ title, guidance }) => ({ title, guidance })),
      ...(esAdmin && paraTodos ? { is_global: true } : {}),
      ...(esAdmin && !paraTodos ? { tenant_ids: elegidos } : {}),
    });
    setCargando(false);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    reiniciar();
    router.refresh();
    alPublicar(`Se publicaron ${r.creadas} respuestas en la base del bot.`);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">
          Importar a la base del bot
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Excel o CSV (columnas Pregunta y Respuesta), PDF, Word, texto, imágenes o audios. Revisás
          todo antes de publicar.
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {filas.length === 0 ? (
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-panel border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-soft hover:bg-sunk">
            <span className="font-semibold text-ink">
              {cargando ? "Leyendo el archivo…" : "Elegir archivo"}
            </span>
            <span className="text-xs">Hasta 3 MB</span>
            <input
              type="file"
              accept={TIPOS}
              className="sr-only"
              disabled={cargando}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                e.target.value = "";
                if (archivo) void leer(archivo);
              }}
            />
          </label>
        ) : (
          <>
            <p className="text-xs text-ink-soft">
              {origen === "ia"
                ? "La IA ordenó el archivo en preguntas y respuestas. Revisalas: sacá las que no sirvan."
                : "Leí el archivo tal cual."}{" "}
              {incluidas.length} de {filas.length} seleccionadas.
            </p>
            <ul className="flex flex-col gap-2">
              {filas.map((f, i) => (
                <li key={i} className="rounded-control border border-line px-3 py-2">
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={f.incluir}
                      onChange={(e) =>
                        setFilas((xs) => xs.map((x, j) => (j === i ? { ...x, incluir: e.target.checked } : x)))
                      }
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">{f.title || "Indicación"}</span>
                      <span className="block text-ink-soft">{f.guidance}</span>
                      {f.avisos?.map((a) => (
                        <span key={a} className="mt-1 block text-xs font-medium text-warn-ink">
                          ⚠ {a}
                        </span>
                      ))}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
        {error ? <Aviso tono="bad">{error}</Aviso> : null}
      </div>

      {filas.length > 0 ? (
        <footer className="flex flex-col gap-3 border-t border-line px-5 py-4">
          {esAdmin ? (
            <fieldset className="flex flex-col gap-1.5 text-sm">
              <legend className="mb-1 text-xs font-medium text-ink-soft">¿En qué bots se publica?</legend>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={paraTodos} onChange={(e) => setParaTodos(e.target.checked)} />
                Todos los bots
              </label>
              {!paraTodos ? (
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {bots.map((b) => (
                    <label key={b.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={elegidos.includes(b.id)}
                        onChange={(e) =>
                          setElegidos((xs) => (e.target.checked ? [...xs, b.id] : xs.filter((x) => x !== b.id)))
                        }
                      />
                      {b.nombre}
                    </label>
                  ))}
                </div>
              ) : null}
            </fieldset>
          ) : (
            <p className="text-xs text-ink-soft">Se publica en el bot de {tenantName}.</p>
          )}
          <div className="flex justify-end gap-2">
            <Boton type="button" disabled={cargando} onClick={reiniciar}>
              Elegir otro archivo
            </Boton>
            <Boton
              type="button"
              variante="primario"
              disabled={cargando || incluidas.length === 0 || (esAdmin && !paraTodos && elegidos.length === 0)}
              onClick={() => void publicar()}
            >
              {cargando ? "Publicando…" : `Publicar ${incluidas.length}`}
            </Boton>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
