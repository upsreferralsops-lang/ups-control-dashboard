import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ vencida?: string }>;
}) {
  const { vencida } = await searchParams;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(26rem,32rem)]">
      {/* Panel izquierdo: identidad del producto, no decoracion. */}
      <aside className="hidden flex-col justify-between bg-ink p-12 text-paper lg:flex">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-sm bg-signal font-mono text-sm font-bold text-white">
            UR
          </span>
          <span className="text-sm font-medium tracking-tight">Consola de referidos</span>
        </div>

        <div className="max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight">
            Cada bot, su propia operación.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-paper/60">
            Seguimiento de candidatos por canal: quiénes se refirieron, quiénes
            quedaron esperando posiciones y quiénes se cayeron del proceso.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          {[
            ["Warehouse", "Package Handler"],
            ["Helper", "solo en peak"],
            ["SSD", "solo en peak"],
          ].map(([puesto, nota]) => (
            <div key={puesto}>
              <dt className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40">
                {nota}
              </dt>
              <dd className="mt-1 text-sm font-medium">{puesto}</dd>
            </div>
          ))}
        </dl>
      </aside>

      <main className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-signal font-mono text-sm font-bold text-white">
              UR
            </span>
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight lg:mt-0">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Con tu cuenta ves solo los bots que tenés asignados.
          </p>

          {vencida && (
            <p className="mt-6 border-l-2 border-warn bg-warn-wash px-3 py-2 text-sm text-ink">
              Tu sesión venció. Volvé a entrar.
            </p>
          )}

          <LoginForm />
        </div>
      </main>
    </div>
  );
}
