import { Hueso } from "@/components/ui";

export default function Cargando() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Hueso className="h-4 w-28" />
        <div className="mt-3 flex items-center gap-3">
          <Hueso className="h-7 w-56" />
          <Hueso className="h-5 w-24" />
        </div>
        <Hueso className="mt-2 h-4 w-72" />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="flex flex-col gap-6">
          <Hueso className="h-64 w-full" />
          <Hueso className="h-36 w-full" />
        </div>
        <Hueso className="h-[28rem] w-full" />
      </div>
    </div>
  );
}
