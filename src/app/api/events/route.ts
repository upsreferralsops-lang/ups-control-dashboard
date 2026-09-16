import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy SSE al core con el JWT de la cookie httpOnly. EventSource en el browser
 * no puede mandar Authorization; acá el servidor reenvía el stream.
 */
export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response("No autenticado", { status: 401 });
  }

  const base = process.env.CORE_API_URL ?? "http://localhost:8090";
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/events/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      cache: "no-store",
    });
  } catch {
    return new Response("No se pudo conectar con el core", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.statusText || "Error del core", { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
