import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, SESSION_COOKIE, SessionExpiredError, type Session } from "./api";

/**
 * Sesion del usuario, resuelta contra el core en cada request.
 *
 * A proposito no se confia en el contenido de la cookie: el core valida el
 * token y responde que tenants ve ese usuario. Si el dashboard decidiera el
 * alcance por su cuenta, habria dos fuentes de verdad y tarde o temprano un
 * cliente terminaria viendo datos de otro.
 */
export async function requireSession(): Promise<Session> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect("/login");

  try {
    return await getSession();
  } catch (error) {
    if (error instanceof SessionExpiredError) redirect("/login?vencida=1");
    throw error;
  }
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/");
  return session;
}
