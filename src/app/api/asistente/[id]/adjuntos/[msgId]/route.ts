import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy de la nota de voz o el archivo de un mensaje del asistente, para escucharla
 * o abrirlo en el chat. Mismo motivo que /api/media: un <audio> no puede mandar el
 * JWT, que vive en una cookie httpOnly. El core solo lo da al dueño del hilo.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; msgId: string }> },
) {
  const { id, msgId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^\d+$/.test(msgId)) {
    return new Response("Id inválido", { status: 400 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return new Response("No autenticado", { status: 401 });
  }

  const base = (process.env.CORE_API_URL ?? "http://localhost:8090").trim().replace(/\/$/, "");
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/api/ops/threads/${id}/messages/${msgId}/adjunto`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return new Response("No se pudo conectar con el core", { status: 502 });
  }
  if (!upstream.ok) {
    return new Response(upstream.statusText || "Adjunto no disponible", { status: upstream.status });
  }
  // Igual que /api/media: en Vercel reenviar upstream.body a veces llegaba vacío.
  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, {
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=86400",
    },
  });
}
