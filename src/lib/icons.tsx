/**
 * Los iconos que usa el panel, dibujados a mano. Trazo de 1.5 y grilla de 24.
 * Son decorativos: el significado siempre esta en el texto al lado.
 */
type Props = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconoCandidatos({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M16 19v-1.5a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3V19" />
      <circle cx="9.5" cy="7.5" r="3" />
      <path d="M21 19v-1.5a3 3 0 0 0-2.25-2.9M15.5 4.7a3 3 0 0 1 0 5.6" />
    </svg>
  );
}

export function IconoAdmin({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 4.5 6.4v5c0 4 3.1 7.6 7.5 9.1 4.4-1.5 7.5-5.1 7.5-9.1v-5L12 3.5Z" />
      <path d="m9.2 11.8 2 2 3.6-3.6" />
    </svg>
  );
}

export function IconoBuscar({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m19.5 19.5-4.7-4.7" />
    </svg>
  );
}

export function IconoSalir({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M14.5 8V5.5a1.5 1.5 0 0 0-1.5-1.5H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h7a1.5 1.5 0 0 0 1.5-1.5V16" />
      <path d="M10 12h9.5m0 0-2.75-2.75M19.5 12l-2.75 2.75" />
    </svg>
  );
}

export function IconoVolver({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M19 12H5m0 0 5.5-5.5M5 12l5.5 5.5" />
    </svg>
  );
}

export function IconoCerrar({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M6.5 6.5l11 11m0-11-11 11" />
    </svg>
  );
}

export function IconoOk({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12.5 9.5 17 19 7.5" />
    </svg>
  );
}

export function IconoAlerta({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3.5 21 19.5H3L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

export function IconoReloj({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4.5l3 1.5" />
    </svg>
  );
}

export function IconoNeutro({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

export function IconoError({ className = "h-3.5 w-3.5" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6m0-6-6 6" />
    </svg>
  );
}

/** Cabecera de columna ordenable: sin orden, ascendente o descendente. */
export function IconoOrden({
  direccion,
  className = "h-3 w-3",
}: Props & { direccion: "asc" | "desc" | null }) {
  return (
    <svg {...base} className={className} strokeWidth={2}>
      <path d="M12 5v14" opacity={direccion ? 1 : 0.35} />
      {direccion === "desc" ? (
        <path d="m6.5 13.5 5.5 5.5 5.5-5.5" />
      ) : (
        <path d="M6.5 10.5 12 5l5.5 5.5" opacity={direccion ? 1 : 0.35} />
      )}
    </svg>
  );
}

/* --- Login ---------------------------------------------------------------- */

/** Marca de la consola. */
export function IconoCamion({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 7.5A1.5 1.5 0 0 1 4 6h8.5v10.5H4a1.5 1.5 0 0 1-1.5-1.5v-7.5Z" />
      <path d="M12.5 9.5H17l4 3.5v2a1.5 1.5 0 0 1-1.5 1.5h-7V9.5Z" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

/** Canales conversacionales (WhatsApp / Telegram). */
export function IconoConversacion({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M8.5 15.5H6.5l-3 2.5v-11A1.5 1.5 0 0 1 5 5.5h9A1.5 1.5 0 0 1 15.5 7v1" />
      <path d="M10.5 10h8A1.5 1.5 0 0 1 20 11.5v5A1.5 1.5 0 0 1 18.5 18H14l-3.5 2.5V10Z" />
    </svg>
  );
}

/** Dato cifrado / no persistido. */
export function IconoCandado({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="1.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
      <path d="M12 14.5v2" />
    </svg>
  );
}

/** Alcance restringido a lo asignado. */
export function IconoAlcance({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
      <path d="M13.5 17h7m-3.5-3.5v7" />
    </svg>
  );
}

export function IconoOjo({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

export function IconoOjoTachado({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 4.5 20 20" />
      <path d="M9.6 9.7a2.75 2.75 0 0 0 3.8 3.8" />
      <path d="M6.6 6.8C4.2 8.3 2.5 12 2.5 12s3.5 5.5 9.5 5.5c1.6 0 3-.4 4.2-1M17.8 15c2-1.5 3.7-3 3.7-3s-3.5-5.5-9.5-5.5c-.7 0-1.3.1-1.9.2" />
    </svg>
  );
}

/** Campo validado. */
export function IconoCheck({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}

export function IconoInfo({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5m0-8.2v.2" />
    </svg>
  );
}

/** Entrar a la consola. */
export function IconoEntrar({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M9.5 8V5.5A1.5 1.5 0 0 1 11 4h7a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-7a1.5 1.5 0 0 1-1.5-1.5V16" />
      <path d="M4.5 12H14m0 0-2.75-2.75M14 12l-2.75 2.75" />
    </svg>
  );
}

/* --- Home / resumen -------------------------------------------------------- */

export function IconoHome({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9.5a1 1 0 0 0 1 1h3.5V15h3v5.5H17a1 1 0 0 0 1-1V10" />
    </svg>
  );
}

/** Clientes/bots como organización, distinto del icono de candidatos (personas). */
export function IconoEdificio({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="5" y="3.5" width="10" height="17" rx="1" />
      <path d="M15 9.5h4v11H9.5" />
      <path d="M8 7h4M8 10.5h4M8 14h4" />
    </svg>
  );
}

/** Dos flechas: cambiar de vista (impersonificacion). */
export function IconoIntercambio({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M16.5 8.5 19.5 5.5 16.5 2.5M19.5 5.5H8.5" />
      <path d="M7.5 15.5 4.5 18.5 7.5 21.5M4.5 18.5h11" />
    </svg>
  );
}

/** Refrescar los datos del servidor (Home). */
export function IconoActualizar({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5" />
      <path d="M16.5 4.5v3.2h-3.2M7.5 19.5v-3.2h3.2" />
    </svg>
  );
}

/** Canal Telegram: distinto del globo de WhatsApp (IconoConversacion). */
export function IconoEnviar({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 4.5 3.5 11.2l6 2.3M20.5 4.5 14.8 20l-5.3-6.5M20.5 4.5 9.5 13.7" />
    </svg>
  );
}

/* --- Iconos del mockup de Home (equivalentes a los Material Symbols) ------- */

/** "dashboard": Home Resumen en la nav. */
export function IconoPanel({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.2" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

/** "how_to_reg": candidato ya referido. */
export function IconoPersonaCheck({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="9.5" cy="7.5" r="3.5" />
      <path d="M3 20v-1.5a4 4 0 0 1 4-4h5" />
      <path d="m14.5 17.5 2 2 4-4.5" />
    </svg>
  );
}

/** "contact_support": derivaciones y alertas pendientes de revision. */
export function IconoConsulta({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.8 9.6a2.3 2.3 0 1 1 2.9 2.2c-.5.2-.7.6-.7 1.1v.4" />
      <path d="M12 16.4h.01" />
    </svg>
  );
}

/** "expand_more": el chevron del selector de cliente. */
export function IconoChevron({ className = "h-4 w-4" }: Props) {
  return (
    <svg {...base} className={className}>
      <path d="m7 10 5 5 5-5" />
    </svg>
  );
}
