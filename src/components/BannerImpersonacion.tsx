"use client";

import { salirImpersonacion } from "@/app/actions/impersonate";
import type { Impersonation, SessionUser } from "@/lib/api";
import { Boton } from "@/components/ui";
import { useTransition } from "react";

export function BannerImpersonacion({
  user,
  impersonation,
}: {
  user: SessionUser;
  impersonation: Impersonation;
}) {
  const [pendiente, iniciar] = useTransition();
  const admin = impersonation.admin_name || impersonation.admin_email;

  return (
    <div
      role="status"
      className="shrink-0 rounded-panel border border-warn-border bg-signal-wash px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-signal-ink">
          Vista de cliente: estás viendo el panel como{" "}
          <strong className="text-ink">{user.name ?? user.email}</strong> ({user.email}). Sesión
          admin: {admin}.
        </p>
        <Boton
          type="button"
          variante="accent"
          className="!min-h-8 shrink-0"
          disabled={pendiente}
          onClick={() => iniciar(() => salirImpersonacion())}
        >
          {pendiente ? "Volviendo…" : "Volver a administrador"}
        </Boton>
      </div>
    </div>
  );
}
