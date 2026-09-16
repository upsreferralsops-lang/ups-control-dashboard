import { notFound } from "next/navigation";
import { CoreApiError } from "@/lib/api";
import { loadCandidatoDetalle } from "@/lib/candidato-detalle";
import {
  filtrarHistorial,
  ordenarHistorialDesc,
  paginarHistorial,
  parseFiltrosHistorial,
} from "@/lib/historial-aplicaciones";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { HistorialFiltros } from "./HistorialFiltros";
import { HistorialLista } from "./HistorialLista";
import { HistorialPaginacion } from "./HistorialPaginacion";

export const dynamic = "force-dynamic";

export default async function CandidatoHistorialPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    q?: string;
    tipo?: string;
    elegidas?: string;
    pagina?: string;
    por_pagina?: string;
  }>;
}) {
  await requireSession();
  const { id } = await params;
  const raw = await searchParams;
  const filtros = parseFiltrosHistorial(raw);

  let detalle;
  try {
    detalle = await loadCandidatoDetalle(id);
  } catch (error) {
    if (error instanceof CoreApiError && error.status === 404) notFound();
    return (
      <Aviso tono="bad">
        {error instanceof CoreApiError ? error.message : "Error leyendo el candidato."}
      </Aviso>
    );
  }

  const filtrados = ordenarHistorialDesc(filtrarHistorial(detalle.application_history, filtros));
  const pagina = paginarHistorial(filtrados, filtros.pagina, filtros.porPagina);
  const filtrosPagina = { ...filtros, pagina: pagina.pagina };

  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="text-sm text-ink-soft">
        Postulaciones donde se ejecutó el workflow de referido: completadas con éxito o fallidas por
        un error. Los filtros se reflejan en la URL.
      </p>

      <HistorialFiltros candidateId={id} filtros={filtrosPagina} />

      <HistorialLista entries={pagina.items} />

      <div className="rounded-panel border border-line bg-surface">
        <HistorialPaginacion
          candidateId={id}
          filtros={filtrosPagina}
          pagina={pagina.pagina}
          totalPaginas={pagina.totalPaginas}
          total={pagina.total}
          desde={pagina.desde}
          hasta={pagina.hasta}
        />
      </div>
    </div>
  );
}
