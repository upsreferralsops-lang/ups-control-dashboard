import { Aviso } from "@/components/ui";
import {
  IconoAlcance,
  IconoCamion,
  IconoCandado,
  IconoConversacion,
} from "@/lib/icons";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

const PILARES = [
  {
    Icono: IconoConversacion,
    titulo: "Supervisión en tiempo real de WhatsApp y Telegram",
    detalle:
      "Auditoría continua de interacciones y derivación transparente de candidatos.",
  },
  {
    Icono: IconoCandado,
    titulo: "Cifrado y descarte de datos sensibles",
    detalle:
      "Protección estricta de privacidad: los identificadores sensibles nunca se persisten en texto plano.",
  },
  {
    Icono: IconoAlcance,
    titulo: "Acceso restringido por asignación directa",
    detalle:
      "Visualización estricta de los canales y grupos aprobados formalmente por tu supervisor.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ vencida?: string }>;
}) {
  const { vencida } = await searchParams;

  return (
    <div className="tema-fijo grid min-h-screen bg-paper lg:grid-cols-[1fr_minmax(28rem,40rem)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        {/* Dos focos calidos: el de arriba marca la identidad, el de abajo
            evita que el panel se lea como un rectangulo plano. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.16),transparent_38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(217,119,6,0.07),transparent_32%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col gap-10">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-panel bg-signal text-white">
              <IconoCamion className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em]">
                UPS Global Recruitment
              </p>
              <p className="font-mono text-[11px] text-signal/80">
                Consola de Operaciones Directas
              </p>
            </div>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-ok-border" aria-hidden />
            Supervisión Operativa Segura
          </div>

          <div className="max-w-md">
            <h1 className="text-[2.1rem] font-bold leading-[1.15] tracking-tight">
              Gestión centralizada de postulaciones y bots.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Plataforma para la validación, trazabilidad y supervisión en tiempo real del
              flujo de candidatos hacia el ATS corporativo de UPS Careers.
            </p>
          </div>

          <ul className="flex max-w-md flex-col gap-5">
            {PILARES.map(({ Icono, titulo, detalle }) => (
              <li key={titulo} className="flex gap-3.5">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-control border border-white/10 bg-white/[0.07] text-signal">
                  <Icono className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-semibold leading-snug">{titulo}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/50">{detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-xl items-center justify-between border-t border-white/10 pt-6 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-white/40">
            <IconoCandado className="h-3.5 w-3.5" />
            Sesión Encriptada TLS 1.3
          </span>
          <span className="text-signal/70">Build v2.4.1</span>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-panel bg-signal text-white">
              <IconoCamion className="h-5 w-5" />
            </span>
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight lg:mt-0">Iniciar Sesión</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Introduce tus credenciales corporativas autorizadas.
          </p>

          {vencida && (
            <div className="mt-6">
              <Aviso tono="warn" titulo="Sesión vencida">
                Tu sesión venció. Volvé a entrar.
              </Aviso>
            </div>
          )}

          <LoginForm />

          <p className="mt-10 border-t border-line pt-5 text-center font-mono text-[11px] text-signal-ink/70">
            UPS Careers Operations Gate · Acceso Autorizado Únicamente
          </p>
        </div>
      </main>
    </div>
  );
}
