import { redirect } from "next/navigation";
import { CoreApiError, listTenants, listUsers } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import { PANEL_ADMIN_CLIENTES_BOTS } from "@/lib/features";
import { timeAgo } from "@/lib/status";
import { Aviso, Bloque, Etiqueta } from "@/components/ui";
import { AsignarBots } from "./AsignarBots";
import { Bot } from "./Bot";
import { NuevoUsuario } from "./NuevoUsuario";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!PANEL_ADMIN_CLIENTES_BOTS) redirect("/");
  await requireAdmin();

  let usuarios, bots;
  try {
    [usuarios, bots] = await Promise.all([listUsers(), listTenants()]);
  } catch (error) {
    return (
      <Aviso tono="bad">
        {error instanceof CoreApiError ? error.message : "Error leyendo la administración."}
      </Aviso>
    );
  }

  const totalCandidatos = bots.reduce((n, b) => n + b.candidatos, 0);
  const activos = bots.filter((b) => b.active).length;

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

      <Bloque
        titulo="Inventario de bots"
        extra={
          <span className="text-xs tabular-nums text-ink-faint">
            {bots.length} registros · {activos} activos · {totalCandidatos} candidatos
          </span>
        }
      >
        {bots.length === 0 ? (
          <p className="text-sm text-ink-soft">No hay bots creados.</p>
        ) : (
          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((b) => (
              <Bot
                key={b.id}
                bot={b}
                parte={totalCandidatos > 0 ? (b.candidatos / totalCandidatos) * 100 : 0}
              />
            ))}
          </div>
        )}
      </Bloque>

      <Bloque titulo="Nuevo usuario">
        <NuevoUsuario bots={bots} />
      </Bloque>

      <Bloque
        titulo="Usuarios"
        extra={<span className="text-xs tabular-nums text-ink-faint">{usuarios.length}</span>}
        className="overflow-hidden"
        cuerpoClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-sunk/40">
                {["Usuario", "Rol", "Bots asignados", "Último acceso"].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-5 py-2.5 ${h === "Último acceso" ? "text-right" : "text-left"}`}
                  >
                    <span className="eyebrow">{h}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-t border-line/60 align-top">
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{u.name ?? "—"}</p>
                    <p className="font-mono text-xs text-ink-faint">{u.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    {u.role === "admin" ? (
                      <Etiqueta className="bg-signal-wash text-signal-ink">Administrador</Etiqueta>
                    ) : (
                      <Etiqueta>Cliente</Etiqueta>
                    )}
                  </td>
                  <td className="min-w-72 px-5 py-3.5">
                    <AsignarBots
                      userId={u.id}
                      asignados={u.tenants}
                      disponibles={bots}
                      esAdmin={u.role === "admin"}
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs tabular-nums text-ink-faint">
                    {u.last_login_at ? timeAgo(u.last_login_at) : "nunca"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Bloque>
    </div>
  );
}
