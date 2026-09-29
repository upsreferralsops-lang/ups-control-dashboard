import { Aviso } from "@/components/ui";
import type { TenantCredits } from "@/lib/api";

function monto(alerta: TenantCredits): string {
  if (alerta.remaining_usd == null) return "sin saldo leíble";
  return `US$ ${alerta.remaining_usd.toFixed(2)}`;
}

export function BannerCreditos({ alertas }: { alertas: TenantCredits[] }) {
  if (alertas.length === 0) return null;

  const agotados = alertas.some((a) => a.nivel === "agotado");
  const unico = alertas.length === 1;

  return (
    <Aviso
      tono={agotados ? "bad" : "warn"}
      titulo={
        agotados
          ? unico
            ? "Tu bot se quedó sin créditos"
            : "Hay bots sin créditos"
          : unico
            ? "Tu bot está por quedarse sin créditos"
            : "Hay bots con créditos bajos"
      }
    >
      <ul className="list-disc space-y-1 pl-4">
        {alertas.map((alerta) => (
          <li key={alerta.tenant_id}>
            <strong className="text-ink">{alerta.name || alerta.slug}</strong>
            {": "}
            {monto(alerta)} restantes (aviso bajo US$ {alerta.threshold_usd}). Recargá
            la cuenta de OpenRouter de ese cliente para que el bot no deje de
            responder.
          </li>
        ))}
      </ul>
    </Aviso>
  );
}
