import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSession,
  SESSION_COOKIE,
  SessionExpiredError,
  type Session,
} from "./api";
import { esFalloDeCore, rutaEstadoServicio } from "./service-status";

/**
 * Sesion del usuario, resuelta contra el core en cada request.
 *
 * A proposito no se confia en el contenido de la cookie: el core valida el
 * token y responde que tenants ve ese usuario. Si el dashboard decidiera el
 * alcance por su cuenta, habria dos fuentes de verdad y tarde o temprano un
 * cliente terminaria viendo datos de otro.
 */
export const requireSession = cache(async (): Promise<Session> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  try {
    const session = await getSession();
    // Un admin mirando como otro usuario no elige la contrasena de ese usuario:
    // la clave temporal la cambia el dueño cuando entra el mismo.
    if (session.user.must_change_password && !session.impersonation) {
      redirect("/cambiar-contrasena");
    }
    return session;
  } catch (error) {
    if (error instanceof SessionExpiredError) redirect("/login?vencida=1");
    if (esFalloDeCore(error)) {
      redirect(rutaEstadoServicio("core", { from: "/" }));
    }
    throw error;
  }
});

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/");
  return session;
}
