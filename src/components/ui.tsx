/**
 * Piezas compartidas del panel: campos, botones, bloques, avisos y badges.
 */
import type { ComponentProps, ReactNode } from "react";
import { DIAS_INACTIVIDAD_ABANDONO, presentacionReferido, statusOf } from "@/lib/status";

/** Clases del campo de formulario. */
export const CAMPO =
  "w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink " +
  "placeholder:text-ink-faint transition-colors duration-150 " +
  "hover:border-ink-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/40 " +
  "disabled:opacity-60";

const BOTON = {
  primario:
    "bg-brand text-white hover:bg-brand-ink active:bg-brand-ink border border-transparent",
  neutro:
    "border border-line-strong bg-surface text-ink-soft hover:border-ink-faint hover:bg-sunk hover:text-ink",
  ok: "bg-ok text-white hover:opacity-90 border border-transparent",
  accent:
    "border border-warn-border bg-signal-wash text-signal-ink hover:bg-warn-wash",
} as const;

export function Boton({
  variante = "neutro",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: keyof typeof BOTON }) {
  return (
    <button
      {...props}
      className={
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-control px-3 py-2 " +
        "text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed " +
        `disabled:opacity-60 ${BOTON[variante]} ${className}`
      }
    />
  );
}

/** Bloque de contenido. Separado con bordes, no con sombras. */
export function Bloque({
  titulo,
  extra,
  className = "",
  cuerpoClassName = "p-5",
  children,
}: {
  titulo?: string;
  extra?: ReactNode;
  className?: string;
  /** Clases del cuerpo; usá `p-0` para tablas a sangre. */
  cuerpoClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-panel border border-line bg-surface ${className}`}>
      {titulo && (
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-5 py-3">
          <h2 className="eyebrow">{titulo}</h2>
          {extra}
        </header>
      )}
      <div className={cuerpoClassName}>{children}</div>
    </section>
  );
}

const TONO = {
  bad: "border-bad bg-bad-wash",
  warn: "border-warn bg-warn-wash",
  ok: "border-ok bg-ok-wash",
  info: "border-brand bg-brand-wash",
} as const;

/** Aviso con acento izquierdo. */
export function Aviso({
  tono = "info",
  titulo,
  children,
}: {
  tono?: keyof typeof TONO;
  titulo?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role={tono === "bad" ? "alert" : undefined}
      className={`rounded-control border border-line border-l-4 px-4 py-3 ${TONO[tono]}`}
    >
      {titulo && <p className="text-sm font-semibold">{titulo}</p>}
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

/**
 * Estado de un candidato. Color + icono + etiqueta: nunca solo el color.
 */
export function Estado({
  status,
  candidate,
  inactiveDays = DIAS_INACTIVIDAD_ABANDONO,
  className = "",
}: {
  status: string;
  /** Si se pasa, «Sin referir» inactivo se muestra como «Abandonado». */
  candidate?: {
    referral_status: string;
    last_candidate_message_at: string | null;
    created_at: string;
  };
  inactiveDays?: number;
  className?: string;
}) {
  const e = candidate ? presentacionReferido(candidate, inactiveDays) : statusOf(status);
  const Icono = e.Icono;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${e.badge} ${className}`}
    >
      <Icono className="h-3 w-3 shrink-0" />
      <span>{e.label}</span>
    </span>
  );
}

/** Marca compacta para canal, handle o rol. */
export function Etiqueta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block rounded-control bg-sunk px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft ${className}`}
    >
      {children}
    </span>
  );
}

/** Rectangulos de carga con la forma del contenido que van a reemplazar. */
export function Hueso({ className = "" }: { className?: string }) {
  return <div className={`latido rounded-control bg-sunk ${className}`} aria-hidden />;
}
