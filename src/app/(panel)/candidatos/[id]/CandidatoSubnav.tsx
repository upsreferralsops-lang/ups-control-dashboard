"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: (id: string) => `/candidatos/${id}`, label: "Resumen", suffix: "" },
  {
    href: (id: string) => `/candidatos/${id}/historial`,
    label: "Historial de aplicaciones",
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
      className="mt-4 flex gap-1 border-b border-line"
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
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-150",
              active
                ? "border-accent text-ink"
                : "border-transparent text-ink-soft hover:border-line hover:text-ink",
            ].join(" ")}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
