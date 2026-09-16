import { Hueso } from "@/components/ui";

/**
 * El panel es force-dynamic: cada filtro y cada orden van al core. Sin esto la
 * pantalla se queda quieta mientras responde. Los huesos tienen la forma de lo
 * que viene, asi que no hay salto de layout al llegar los datos.
 */
export default function Cargando() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Hueso className="h-3 w-20" />
        <Hueso className="mt-2 h-7 w-44" />
      </div>

      <div className="flex flex-col gap-6 rounded-panel border border-line bg-surface px-6 py-5 sm:flex-row sm:items-end">
        <div className="sm:pr-8">
          <Hueso className="h-3 w-20" />
          <Hueso className="mt-2 h-9 w-16" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 border-line sm:grid-cols-5 sm:border-l sm:pl-8">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i}>
              <Hueso className="h-3 w-16" />
              <Hueso className="mt-1.5 h-5 w-10" />
              <Hueso className="mt-1.5 h-0.5 w-full" />
            </div>
          ))}
        </div>
      </div>

      <Hueso className="h-9 w-full" />

      <div className="rounded-panel border border-line bg-surface">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-line/60 px-3 py-3 last:border-0">
            <Hueso className="h-4 flex-[2]" />
            <Hueso className="h-4 flex-[2]" />
            <Hueso className="h-4 flex-1" />
            <Hueso className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
