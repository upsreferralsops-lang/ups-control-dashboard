import Link from "next/link";
import { cerrarSesion } from "@/app/actions/auth";
import { requireSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, tenants } = await requireSession();
  const esAdmin = user.role === "admin";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[88rem] items-center gap-8 px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-sm bg-signal font-mono text-xs font-bold text-white">
              UR
            </span>
            <span className="text-sm font-semibold tracking-tight">Consola de referidos</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/"
              className="rounded-sm px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
            >
              Candidatos
            </Link>
            {esAdmin && (
              <Link
                href="/admin"
                className="rounded-sm px-2.5 py-1.5 text-ink-soft transition-colors hover:bg-sunk hover:text-ink"
              >
                Usuarios y bots
              </Link>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user.name ?? user.email}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                {esAdmin ? "admin · todos los bots" : `${tenants.length} bot${tenants.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="rounded-sm border border-line px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[88rem] flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
