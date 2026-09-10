import Link from "next/link";
import { notFound } from "next/navigation";
import { CoreApiError, getCandidate, type CandidateDetail } from "@/lib/api";
import { fullName, statusOf, timeAgo } from "@/lib/status";
import { ConfirmarReferido } from "./ConfirmarReferido";

export const dynamic = "force-dynamic";

function Dato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900 dark:text-slate-100">{value || "—"}</dd>
    </div>
  );
}

export default async function CandidatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let detalle: CandidateDetail;
  try {
    detalle = await getCandidate(id);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-950/30">
        <p className="text-sm text-rose-700 dark:text-rose-400">
          {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
        </p>
      </div>
    );
  }

  const { candidate: c, conversation } = detalle;
  const estado = statusOf(c.referral_status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/"
          className="text-sm text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
        >
          ← Volver al panel
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">{fullName(c)}</h1>
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${estado.chip}`}
          >
            {estado.label}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">
            {c.channel}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{estado.help}</p>
      </div>

      {c.sensitive_data_received && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            Este candidato envio datos sensibles por chat. El sistema los removio antes de
            guardarlos, y el bot le pidio que borre el mensaje.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">Ficha</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Dato label="Correo" value={c.email} />
              <Dato label="Telefono" value={c.phone} />
              <Dato label="Ciudad" value={c.city} />
              <Dato label="ZIP" value={c.zip} />
              <Dato label="Puesto elegido" value={c.matched_warehouse_name} />
              <Dato label="Estado tecnico" value={c.status} />
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-semibold">Referido</h2>
            <div className="mt-4">
              <ConfirmarReferido
                candidateId={id}
                yaConfirmado={c.referral_status === "sent_confirmed"}
              />
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Conversacion</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {conversation.length} mensajes · ultimo{" "}
              {timeAgo(conversation.at(-1)?.created_at ?? null)}
            </span>
          </div>
          <div className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto">
            {conversation.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Todavia no hay mensajes.
              </p>
            )}
            {conversation.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.direction === "in"
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "self-end bg-sky-600 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    m.direction === "in"
                      ? "text-slate-500 dark:text-slate-400"
                      : "text-sky-100"
                  }`}
                >
                  {m.direction === "in" ? "Candidato" : "Bot"} · {timeAgo(m.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
