import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Proxy de los adjuntos que una persona le manda al candidato (HITL): foto,
 * archivo o nota de voz. El archivo viaja como cuerpo binario; el JWT vive en
 * una cookie httpOnly, por eso no se puede subir directo al core.
 *
 * ponytail: en Vercel el cuerpo de una request tiene tope de 4.5 MB. Las fotos
 * se achican en el navegador antes de subir; si hace falta mas, subida directa
 * al core con un token de corta duracion.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ detail: "Id inválido" }, { status: 400 });
  }
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return Response.json({ detail: "No autenticado" }, { status: 401 });
  }

  const entrante = new URL(request.url);
  const query = new URLSearchParams();
  for (const clave of ["nombre", "nota_de_voz", "pie"]) {
    const valor = entrante.searchParams.get(clave);
    if (valor) query.set(clave, valor);
  }

  const base = (process.env.CORE_API_URL ?? "http://localhost:8090").trim().replace(/\/$/, "");
  try {
    const upstream = await fetch(`${base}/api/candidates/${id}/attachments?${query}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": request.headers.get("Content-Type") ?? "application/octet-stream",
      },
      body: await request.arrayBuffer(),
      cache: "no-store",
    });
    const cuerpo = await upstream.json().catch(() => ({ detail: upstream.statusText }));
    return Response.json(cuerpo, { status: upstream.status });
  } catch {
    return Response.json({ detail: "No se pudo conectar con el core" }, { status: 502 });
  }
}
