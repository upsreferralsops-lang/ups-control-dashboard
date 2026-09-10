import Link from "next/link";
import { notFound } from "next/navigation";
import { CoreApiError, getCandidate, type CandidateDetail } from "@/lib/api";
import { requireSession } from "@/lib/session";
import { fullName, statusOf, timeAgo } from "@/lib/status";
import { ConfirmarReferido } from "./ConfirmarReferido";

export const dynamic = "force-dynamic";

function Dato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function CandidatoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  let detalle: CandidateDetail;
  try {
    detalle = await getCandidate(id);
  } catch (error) {
    // Un candidato de otro cliente responde 404, igual que uno inexistente:
    // el panel no confirma que ese id exista en otra operacion.
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <div className="border-l-2 border-bad bg-bad-wash px-4 py-3 text-sm">
        {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
      </div>
    );
  }

  const { candidate: c, conversation } = detalle;
  const estado = statusOf(c.referral_status);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/" className="text-sm text-ink-soft hover:text-ink">
          ← Candidatos
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{fullName(c)}</h1>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
            <span className={estado.text}>{estado.label}</span>
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            {c.channel}
          </span>
        </div>
        <p className="mt-1.5 text-sm text-ink-soft">{estado.help}</p>
      </div>

      {c.sensitive_data_received && (
        <div className="border-l-2 border-warn bg-warn-wash px-4 py-3">
          <p className="text-sm font-medium">Envió datos sensibles por chat</p>
          <p className="mt-1 text-sm text-ink-soft">
            El sistema los quitó antes de guardarlos y le pidió que borre el mensaje. El valor
            real nunca quedó registrado.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-6">
          <section className="border border-line bg-surface p-5">
            <p className="eyebrow">Ficha</p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Dato label="Correo" value={c.email} />
              <Dato label="Teléfono" value={c.phone} />
              <Dato label="Ciudad" value={c.city} />
              <Dato label="ZIP" value={c.zip} />
              <div className="col-span-2">
                <Dato label="Posición elegida" value={c.matched_warehouse_name} />
              </div>
              <Dato label="Estado interno" value={c.status} />
              <Dato label="Aplicación" value={c.application_status} />
            </dl>
          </section>

          <section className="border border-line bg-surface p-5">
            <p className="eyebrow">Referido</p>
            <div className="mt-4">
              <ConfirmarReferido
                candidateId={id}
                yaConfirmado={c.referral_status === "sent_confirmed"}
              />
            </div>
          </section>
        </div>

        <section className="border border-line bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Conversación</p>
            <span className="font-mono text-xs text-ink-faint">
              {conversation.length} mensajes · {timeAgo(conversation.at(-1)?.created_at ?? null)}
            </span>
          </div>

          <div className="mt-4 flex max-h-[34rem] flex-col gap-2.5 overflow-y-auto pr-1">
            {conversation.length === 0 && (
              <p className="text-sm text-ink-soft">Todavía no hay mensajes.</p>
            )}
            {conversation.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3 py-2 text-sm ${
                  m.direction === "in"
                    ? "self-start rounded-r-sm rounded-tl-sm border-l-2 border-line-strong bg-sunk"
                    : "self-end rounded-l-sm rounded-tr-sm border-r-2 border-signal bg-signal-wash"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
                  {m.direction === "in" ? "candidato" : "bot"} · {timeAgo(m.created_at)}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
