import Link from "next/link";
import { Aviso } from "@/components/ui";
import { rutaEstadoServicio } from "@/lib/service-status";

/** Aviso amigable cuando el backend no responde; sin detalles técnicos. */
export function AvisoServicioIndisponible({ from = "/" }: { from?: string }) {
  return (
    <Aviso tono="warn" titulo="La consola no está disponible ahora">
      <p>
        Estamos teniendo dificultades para mostrar la información. Nuestro equipo ya está al tanto.
      </p>
      <p className="mt-3">
        <Link
          href={rutaEstadoServicio("core", { from })}
          className="text-sm font-semibold text-signal-ink hover:text-brand"
        >
          Ver qué puedo hacer →
        </Link>
      </p>
    </Aviso>
  );
}
