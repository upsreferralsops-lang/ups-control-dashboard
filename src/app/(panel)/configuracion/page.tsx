import {
  CoreApiError,
  listTenantImprovementCases,
  listUsers,
  type AdminUser,
  type Tenant,
} from "@/lib/api";
import { nombreVisibleCliente } from "@/lib/etiquetas-cliente";
import { requireSession } from "@/lib/session";
import { Aviso } from "@/components/ui";
import { SelectorCliente } from "../SelectorCliente";
import { BancoReglas } from "./BancoReglas";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Configuración | Talent Ops",
};

function opcionesDeConfig(args: {
  esAdmin: boolean;
  sessionTenants: Tenant[];
  adminUsers: AdminUser[] | null;
}): { id: string; nombre: string }[] {
  const { esAdmin, sessionTenants, adminUsers } = args;
  const opciones = sessionTenants.map((t) => ({
    id: t.id,
    nombre: esAdmin ? nombreVisibleCliente(t.id, adminUsers, t.name) : t.name,
  }));
  return opciones.toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const session = await requireSession();
  const { cliente } = await searchParams;
  const esAdmin = session.user.role === "admin";
  const tenants = session.tenants;

  if (tenants.length === 0) {
    return (
      <div data-fill-panel className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-brand">Configuración</h1>
        <Aviso tono="warn" titulo="Todavía no tenés bots">
          Cuando te asignen un cliente vas a poder crear reglas y probarlas acá.
        </Aviso>
      </div>
    );
  }

  let adminUsers: AdminUser[] | null = null;
  if (esAdmin) {
    try {
      adminUsers = await listUsers();
    } catch {
      adminUsers = null;
    }
  }

  const opciones = opcionesDeConfig({
    esAdmin,
    sessionTenants: tenants,
    adminUsers,
  });
  const primero = opciones[0];
  if (!primero) {
    return (
      <div data-fill-panel className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-brand">Configuración</h1>
        <Aviso tono="warn" titulo="Todavía no tenés bots">
          Cuando te asignen un cliente vas a poder crear reglas y probarlas acá.
        </Aviso>
      </div>
    );
  }

  const pedido = cliente && opciones.some((o) => o.id === cliente) ? cliente : primero.id;
  const tenant = tenants.find((t) => t.id === pedido) ?? tenants[0];
  if (!tenant) {
    return (
      <div data-fill-panel className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-brand">Configuración</h1>
        <Aviso tono="warn" titulo="Todavía no tenés bots">
          Cuando te asignen un cliente vas a poder crear reglas y probarlas acá.
        </Aviso>
      </div>
    );
  }
  const etiqueta = opciones.find((o) => o.id === tenant.id)?.nombre ?? tenant.name;

  let casos = [];
  try {
    casos = await listTenantImprovementCases(tenant.id);
  } catch (error) {
    return (
      <div data-fill-panel className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-brand">Configuración</h1>
        <Aviso tono="bad" titulo="No se pudieron leer las reglas">
          {error instanceof CoreApiError ? error.message : "Error leyendo el core."}
        </Aviso>
      </div>
    );
  }

  return (
    <div
      data-fill-panel
      className="-mx-5 flex min-h-[70vh] flex-1 flex-col gap-4 px-5 sm:-mx-8 sm:px-8 md:h-full md:min-h-0"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-brand">Configuración</h1>
          <p className="mt-1 text-sm text-ink-soft max-sm:hidden">
            {esAdmin
              ? `Reglas del bot de ${etiqueta} (guían todos los chats) y correcciones de una conversación (aviso puntual, no se reutilizan). Si marcás una regla como global, los demás la ven en solo lectura.`
              : `Reglas del bot de ${etiqueta} (guían todos los chats) y correcciones de una conversación (aviso puntual). Las globales las ves en solo lectura.`}
          </p>
        </div>
        {opciones.length > 1 ? (
          <SelectorCliente
            ruta="/configuracion"
            actual={tenant.id}
            opciones={opciones}
            mostrarTodos={false}
          />
        ) : null}
      </div>
      <BancoReglas
        key={tenant.id}
        tenantId={tenant.id}
        tenantName={etiqueta}
        casos={casos}
        esAdmin={esAdmin}
      />
    </div>
  );
}
