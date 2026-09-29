"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { esFalloDeCore, rutaEstadoServicio } from "@/lib/service-status";

export default function PanelError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.error(error);
    const tipo = esFalloDeCore(error) ? "core" : "error";
    router.replace(
      rutaEstadoServicio(tipo, {
        from: pathname,
      }),
    );
  }, [error, pathname, router]);

  return (
    <p className="py-16 text-center text-sm text-ink-soft" role="status">
      Redirigiendo…
    </p>
  );
}
