"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: (id: string) => `/candidatos/${id}`, label: "Resumen", suffix: "" },
  {
    href: (id: string) => `/candidatos/${id}/historial`,
    label: "Historial",
    // En movil se corta aca para que las tres pestañas entren sin scroll.
    resto: " de aplicaciones",
    suffix: "/historial",
  },
  {
    href: (id: string) => `/candidatos/${id}/conversacion`,
    label: "Conversación",
    suffix: "/conversacion",
  },
] as const;

export function CandidatoSubnav({ candidateId }: { candidateId: string }) {
  const pathname = usePathname();
  const base = `/candidatos/${candidateId}`;

  return (
    <nav
      // Celular: control segmentado, como el switch Chat / Historial del asistente.
      className="mt-4 flex gap-1 overflow-x-auto border-b border-line max-md:mt-2 max-md:rounded-control max-md:border-0 max-md:bg-sunk max-md:p-0.5"
      aria-label="Secciones del candidato"
    >
      {tabs.map((tab) => {
        const href = tab.href(candidateId);
        const active =
          tab.suffix === ""
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(`${base}${tab.suffix}`);
        return (
          <Link
            key={tab.label}
            href={href}
            className={[
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150 max-md:mb-0 max-md:flex-1 max-md:rounded-control max-md:border-0 max-md:text-center max-md:font-semibold",
              active
                ? "border-accent text-ink max-md:bg-surface max-md:shadow-sm"
                : "border-transparent text-ink-soft hover:border-line hover:text-ink",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
            {"resto" in tab && <span className="max-sm:hidden">{tab.resto}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
