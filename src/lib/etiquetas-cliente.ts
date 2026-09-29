import type { AdminUser } from "@/lib/api";

/**
 * En el panel el admin ve el dueño del bot (Andres, Erick…), no el nombre
 * interno del tenant ("Ambiente local"). Un cliente sin dueño queda marcado.
 */
export function nombreVisibleCliente(
  tenantId: string,
  adminUsers: AdminUser[] | null | undefined,
  fallback = "Sin usuario asignado",
): string {
  if (!adminUsers) return fallback;
  const owners = adminUsers.filter(
    (u) => u.role === "client" && u.tenants.some((t) => t.id === tenantId),
  );
  if (owners.length === 0) return fallback;
  return owners.map((o) => o.name ?? o.email).join(", ");
}
