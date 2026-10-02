import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CambiarContrasenaForm } from "./CambiarContrasenaForm";
import { SESSION_COOKIE, getSession, SessionExpiredError } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function CambiarContrasenaPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  let session;
  try {
    session = await getSession();
  } catch (error) {
    if (error instanceof SessionExpiredError) redirect("/login?vencida=1");
    throw error;
  }

  if (!session.user.must_change_password) {
    redirect("/");
  }

  return (
    <div className="tema-fijo flex min-h-dvh items-center justify-center bg-paper px-4">
      <div className="w-full max-w-md rounded-panel border border-line bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Elegi tu contrasena</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Es tu primer ingreso con la clave temporal. Crea una contrasena propia (minimo 8 caracteres).
        </p>
        <CambiarContrasenaForm email={session.user.email} />
      </div>
    </div>
  );
}
