import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy de las imagenes adjuntas a mensajes (captura del referido).
 *
 * Mismo motivo que /api/events: un <img> en el navegador no puede mandar el
 * JWT, que vive en una cookie httpOnly. Aca el servidor lo reenvia y el core
 * decide si ese usuario puede ver la imagen (alcance por cliente).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const { messageId } = await params;
  // Solo ids numericos: nada de armar rutas raras hacia el core.
  if (!/^\d+$/.test(messageId)) {
    return new Response("Id invalido", { status: 400 });
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response("No autenticado", { status: 401 });
  }

  const base = (process.env.CORE_API_URL ?? "http://localhost:8090").trim().replace(/\/$/, "");
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/messages/${messageId}/media`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new Response("No se pudo conectar con el core", { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(upstream.statusText || "Imagen no disponible", {
      status: upstream.status,
    });
  }

  // En Vercel, reenviar upstream.body a veces deja PNGs vacios o rotos en <img>.
  const bytes = await upstream.arrayBuffer();
  if (!bytes.byteLength) {
    return new Response("Imagen vacia", { status: 502 });
  }

  const headers: Record<string, string> = {
    "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
    "Content-Length": String(bytes.byteLength),
    "Cache-Control": upstream.headers.get("Cache-Control") ?? "private, max-age=86400",
  };
  // Documentos del chat: se descargan con su nombre original.
  const disposicion = upstream.headers.get("Content-Disposition");
  if (disposicion) headers["Content-Disposition"] = disposicion;
  return new Response(bytes, { headers });
}
