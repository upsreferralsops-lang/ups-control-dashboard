import { EstadoServicioScreen } from "@/components/EstadoServicioScreen";
import { tipoEstadoServicioDesdeQuery } from "@/lib/service-status";

export const dynamic = "force-dynamic";

export default async function MantenimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; from?: string }>;
}) {
  const { tipo, from } = await searchParams;

  return <EstadoServicioScreen tipo={tipoEstadoServicioDesdeQuery(tipo)} from={from} />;
}
