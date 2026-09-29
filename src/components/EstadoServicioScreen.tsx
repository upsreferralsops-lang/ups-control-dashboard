"use client";

import { useEffect, useMemo } from "react";
import { Boton } from "@/components/ui";
import { IconoCamion, IconoConsulta, IconoReloj } from "@/lib/icons";
import type { TipoEstadoServicio } from "@/lib/service-status";

const CONTENIDO: Record<
  TipoEstadoServicio,
  {
    titulo: string;
    mensaje: string;
    consejo: string;
    tono: "warn" | "bad";
    Icono: (props: { className?: string }) => React.ReactElement;
  }
> = {
  core: {
    titulo: "Volvemos enseguida",
    mensaje:
      "La consola no está disponible por unos minutos. Estamos trabajando para restablecer el acceso.",
    consejo: "Podés intentar de nuevo en un momento o volver más tarde con tu mismo usuario.",
    tono: "bad",
    Icono: IconoConsulta,
  },
  mantenimiento: {
    titulo: "Estamos mejorando la plataforma",
    mensaje:
      "Hay un mantenimiento programado. Tu cuenta sigue activa; solo pausamos el acceso mientras terminamos.",
    consejo: "Gracias por tu paciencia. En cuanto abramos de nuevo, podés entrar como siempre.",
    tono: "warn",
    Icono: IconoReloj,
  },
  error: {
    titulo: "No pudimos cargar esta página",
    mensaje: "Ocurrió un inconveniente al mostrar la consola. No es necesario que hagas nada técnico.",
    consejo: "Probá otra vez. Si sigue igual, avisá a tu contacto en operaciones.",
    tono: "bad",
    Icono: IconoConsulta,
  },
};

const REINTENTO_SEG = 45;

function destinoReintento(from: string | undefined): string {
  if (!from || from === "/mantenimiento") return "/";
  if (from.startsWith("/") && !from.startsWith("//")) return from;
  return "/";
}

export function EstadoServicioScreen({
  tipo,
  from,
}: {
  tipo: TipoEstadoServicio;
  from?: string;
}) {
  const cfg = CONTENIDO[tipo];
  const IconoPrincipal = cfg.Icono;
  const reintentarHref = useMemo(() => destinoReintento(from), [from]);

  useEffect(() => {
    if (tipo === "mantenimiento") return;
    const timer = setTimeout(() => {
      window.location.assign(reintentarHref);
    }, REINTENTO_SEG * 1000);
    return () => clearTimeout(timer);
  }, [tipo, reintentarHref]);

  const bordeTono =
    cfg.tono === "warn"
      ? "border-warn-border bg-warn-wash"
      : "border-bad-border bg-bad-wash";

  return (
    <div className="tema-fijo grid min-h-screen bg-paper lg:grid-cols-[minmax(20rem,28rem)_1fr]">
      <aside className="relative hidden flex-col justify-between bg-rail p-10 text-rail-ink lg:flex">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-panel bg-signal text-rail">
              <IconoCamion className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">Referidos UPS</p>
              <p className="text-[13px] text-rail-faint">Consola de operación</p>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-rail-faint">
            Tu información está protegida. Esta pausa es temporal y no afecta el trabajo que ya
            realizaste en la plataforma.
          </p>
        </div>
        <p className="text-xs text-rail-faint">Gracias por tu comprensión.</p>
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-panel bg-signal text-rail">
              <IconoCamion className="h-5 w-5" />
            </span>
          </div>

          <div className={`mt-6 flex gap-4 rounded-panel border p-5 lg:mt-0 ${bordeTono}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-control bg-surface">
              <IconoPrincipal className="h-6 w-6 text-ink" />
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-ink">{cfg.titulo}</h1>
              <p className="mt-3 text-sm leading-relaxed text-ink">{cfg.mensaje}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{cfg.consejo}</p>
            </div>
          </div>

          {tipo !== "mantenimiento" && (
            <p className="mt-5 text-sm text-ink-soft">
              Intentaremos llevarte de vuelta a la consola en unos instantes.
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Boton
              variante="primario"
              type="button"
              onClick={() => window.location.assign(reintentarHref)}
            >
              Intentar de nuevo
            </Boton>
            <Boton
              variante="neutro"
              type="button"
              onClick={() => window.location.assign("/login")}
            >
              Volver al inicio de sesión
            </Boton>
          </div>

          <p className="mt-10 border-t border-line pt-5 text-center text-xs text-ink-soft">
            ¿Necesitás ayuda? Escribí a tu supervisor o al equipo de soporte interno.
          </p>
        </div>
      </main>
    </div>
  );
}
