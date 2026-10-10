"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PreguntaPendiente } from "@/lib/api";
import { Aviso, Boton, CAMPO } from "@/components/ui";
import { timeAgo } from "@/lib/status";
import { descartarPendiente, responderPendiente } from "./actions";

/**
 * Lo que el bot no supo contestar (dijo "el equipo te lo confirma" o pasó la
 * conversación). El cliente escribe cómo debe responder y queda en la base.
 */
export function BandejaSinRespuesta({
  tenantId,
  tenantName,
  pendientes,
}: {
  tenantId: string;
  tenantName: string;
  pendientes: PreguntaPendiente[];
}) {
  const router = useRouter();
  const [textos, setTextos] = useState<Record<number, string>>({});
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [hechos, setHechos] = useState<number[]>([]);

  const visibles = pendientes.filter((p) => !hechos.includes(p.message_id));

  async function accion(p: PreguntaPendiente, responder: boolean) {
    setOcupado(p.message_id);
    setError(null);
    setAviso(null);
    const r = responder
      ? await responderPendiente(tenantId, p.message_id, textos[p.message_id] ?? "")
      : await descartarPendiente(tenantId, p.message_id);
    setOcupado(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setHechos((xs) => [...xs, p.message_id]);
    if (responder) {
      const avisos: string[] = "avisos" in r ? (r.avisos as string[]) : [];
      setAviso(
        avisos.length
          ? `Guardada en la base. Ojo: ${avisos.join(" ")}`
          : "Guardada en la base: el bot ya responde así.",
      );
    }
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">Preguntas sin buena respuesta</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Lo que el bot de {tenantName} no supo contestar en los últimos 30 días. Escribí cómo debe
          responder y queda en su base para todos los chats.
        </p>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {aviso ? <p className="text-xs text-ok-ink">{aviso}</p> : null}
        {error ? <Aviso tono="bad">{error}</Aviso> : null}
        {visibles.length === 0 ? (
          <p className="m-auto max-w-prose py-10 text-center text-sm text-ink-soft">
            No hay preguntas pendientes. Cuando el bot no sepa contestar algo, aparece acá.
          </p>
        ) : (
          visibles.map((p) => (
            <article key={p.message_id} className="flex flex-col gap-2 rounded-control border border-line px-3 py-3">
              <p className="text-sm font-medium text-ink">«{p.pregunta}»</p>
              <p className="text-xs text-ink-soft">
                <Link href={`/candidatos/${p.candidate_id}/conversacion`} className="font-semibold text-brand hover:underline">
                  {p.candidato}
                </Link>{" "}
                · {timeAgo(p.created_at)}
                {p.respuesta_bot ? ` · el bot dijo: «${p.respuesta_bot.slice(0, 120)}${p.respuesta_bot.length > 120 ? "…" : ""}»` : ""}
              </p>
              <label className="sr-only" htmlFor={`resp-${p.message_id}`}>
                Cómo debe responder el bot
              </label>
              <textarea
                id={`resp-${p.message_id}`}
                rows={2}
                className={CAMPO}
                placeholder="Cómo debe responder el bot cuando pregunten esto…"
                value={textos[p.message_id] ?? ""}
                onChange={(e) => setTextos((t) => ({ ...t, [p.message_id]: e.target.value }))}
                disabled={ocupado === p.message_id}
              />
              <div className="flex flex-wrap gap-2">
                <Boton
                  type="button"
                  variante="primario"
                  disabled={ocupado === p.message_id || (textos[p.message_id] ?? "").trim().length < 8}
                  onClick={() => void accion(p, true)}
                >
                  Guardar en la base
                </Boton>
                <Boton type="button" disabled={ocupado === p.message_id} onClick={() => void accion(p, false)}>
                  Descartar
                </Boton>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
