// WhatsApp queda deshabilitado por ahora (la operacion arranca solo con
// Telegram). Agregar"whatsapp" aca lo vuelve a mostrar en todo el panel.
export const CANALES_ACTIVOS: readonly ("telegram" | "whatsapp")[] = ["telegram"];

export const esCanalActivo = (canal: string): canal is "telegram" | "whatsapp" =>
  (CANALES_ACTIVOS as readonly string[]).includes(canal);

// Con un solo canal, la etiqueta de canal no distingue nada y ademas delata el
//"whatsapp" de los candidatos viejos. Vuelve sola al reactivar el canal.
export const MOSTRAR_CANAL = CANALES_ACTIVOS.length > 1;
