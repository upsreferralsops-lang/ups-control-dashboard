import { CoreApiError, listTenants, listUsers } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { timeAgo } from "@/lib/status";
import { AsignarBots } from "./AsignarBots";
import { NuevoUsuario } from "./NuevoUsuario";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();

  let usuarios, bots;
  try {
    [usuarios, bots] = await Promise.all([listUsers(), listTenants()]);
  } catch (error) {
    return (
      <div className="border-l-2 border-bad bg-bad-wash px-4 py-3 text-sm">
        {error instanceof CoreApiError ? error.message : "Error leyendo la administración."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow">Administración</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Usuarios y bots</h1>
        <p className="mt-1.5 max-w-prose text-sm text-ink-soft">
          Cada usuario ve únicamente los candidatos de los bots que tiene asignados. Los
          administradores ven todo.
        </p>
      </div>

      <section className="border border-line bg-surface p-5">
        <p className="eyebrow">Bots activos</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {bots.map((b) => (
            <div key={b.id} className="border border-line px-4 py-3">
              <p className="text-sm font-medium">{b.name}</p>
              <p className="mt-0.5 font-mono text-[11px] text-ink-faint">
                {b.bot_handle ?? b.slug} · {b.channel}
              </p>
              <p className="mt-2 font-mono text-lg font-semibold tabular-nums">
                {b.candidatos}
                <span className="ml-1.5 text-xs font-normal text-ink-faint">candidatos</span>
              </p>
            </div>
          ))}
          {bots.length === 0 && <p className="text-sm text-ink-soft">No hay bots creados.</p>}
        </div>
      </section>

      <section className="border border-line bg-surface p-5">
        <p className="eyebrow">Nuevo usuario</p>
        <div className="mt-4">
          <NuevoUsuario />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <p className="eyebrow">Usuarios ({usuarios.length})</p>
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                {["Usuario", "Rol", "Bots asignados", "Último acceso"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left">
                    <span className="eyebrow">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="font-mono text-xs text-ink-faint">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        u.role === "admin" ? "text-signal-ink" : "text-ink-soft"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          u.role === "admin" ? "bg-signal" : "bg-ink-faint"
                        }`}
                      />
                      {u.role === "admin" ? "Administrador" : "Cliente"}
                    </span>
                  </td>
                  <td className="min-w-72 px-4 py-3">
                    <AsignarBots
                      userId={u.id}
                      asignados={u.tenants}
                      disponibles={bots}
                      esAdmin={u.role === "admin"}
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-faint">
                    {u.last_login_at ? timeAgo(u.last_login_at) : "nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
