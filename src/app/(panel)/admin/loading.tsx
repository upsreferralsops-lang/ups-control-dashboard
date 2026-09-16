import { Hueso } from "@/components/ui";

export default function Cargando() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Hueso className="h-3 w-28" />
        <Hueso className="mt-2 h-7 w-52" />
        <Hueso className="mt-2 h-4 w-80" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Hueso className="h-44 w-full" />
        <Hueso className="h-44 w-full" />
        <Hueso className="h-44 w-full" />
      </div>
      <Hueso className="h-56 w-full" />
      <Hueso className="h-48 w-full" />
    </div>
  );
}
