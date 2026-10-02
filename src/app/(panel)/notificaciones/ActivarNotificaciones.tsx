"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui";
import { IconoCampana } from "@/lib/icons";
import { borrarSuscripcion, clavePush, guardarSuscripcion } from "./actions";

type Estado =
  | "cargando"
  | "sin_soporte"
  | "ios_instalar"
  | "bloqueado"
  | "sin_config"
  | "inactivo"
  | "activo";

function esIOS() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function instalada() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function claveABytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

async function suscripcionActual() {
  const reg = await navigator.serviceWorker.getRegistration("/");
  return reg ? reg.pushManager.getSubscription() : null;
}

const TEXTO: Record<Exclude<Estado, "cargando">, string> = {
  sin_soporte: "Este navegador no permite notificaciones push. Probá con Chrome o con la app instalada.",
  ios_instalar:
    "En iPhone los avisos llegan solo con la app instalada: tocá Compartir y después «Agregar a inicio». " +
    "Abrila desde ese ícono y activá las notificaciones acá.",
  bloqueado:
    "Las notificaciones están bloqueadas para este sitio. Habilitalas desde la configuración del navegador " +
    "(el candado junto a la dirección) y volvé a intentar.",
  sin_config: "Las notificaciones push todavía no están configuradas en el servidor.",
  inactivo:
    "Recibí en este dispositivo, aun con la app cerrada, cuando un candidato pide una persona o te escribe con el bot pausado.",
  activo: "Este dispositivo recibe los avisos aunque la app esté cerrada.",
};

/** PWA: activar las notificaciones push en ESTE dispositivo. */
export function ActivarNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        setEstado(esIOS() && !instalada() ? "ios_instalar" : "sin_soporte");
        return;
      }
      if (Notification.permission === "denied") {
        setEstado("bloqueado");
        return;
      }
      setEstado((await suscripcionActual()) ? "activo" : "inactivo");
    })();
  }, []);

  async function activar() {
    setError(null);
    setOcupado(true);
    try {
      // Primero el permiso, dentro del clic: Safari lo exige.
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }
      const clave = await clavePush();
      if (!clave) {
        setEstado("sin_config");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(clave) }));
      const json = sub.toJSON();
      const r = await guardarSuscripcion({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys?.p256dh ?? "", auth: json.keys?.auth ?? "" },
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      setEstado("activo");
    } catch {
      setError("No se pudo activar. Reintentá en unos segundos.");
    } finally {
      setOcupado(false);
    }
  }

  async function desactivar() {
    setError(null);
    setOcupado(true);
    try {
      const sub = await suscripcionActual();
      if (sub) {
        await borrarSuscripcion(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("inactivo");
    } catch {
      setError("No se pudo desactivar. Reintentá en unos segundos.");
    } finally {
      setOcupado(false);
    }
  }

  if (estado === "cargando") return null;

  return (
    <section className="flex flex-col gap-3 rounded-panel border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
          estado === "activo" ? "bg-ok-wash text-ok-ink" : "bg-sunk text-ink-soft"
        }`}
      >
        <IconoCampana className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {estado === "activo" ? "Avisos activados en este dispositivo" : "Avisos en este dispositivo"}
        </p>
        <p className="mt-0.5 text-sm text-ink-soft">{TEXTO[estado]}</p>
        {error && <p className="mt-1 text-sm text-bad-ink" role="alert">{error}</p>}
      </div>
      {estado === "inactivo" && (
        <Boton variante="primario" disabled={ocupado} onClick={() => void activar()} className="shrink-0">
          {ocupado ? "Activando…" : "Activar notificaciones"}
        </Boton>
      )}
      {estado === "activo" && (
        <Boton disabled={ocupado} onClick={() => void desactivar()} className="shrink-0">
          {ocupado ? "Desactivando…" : "Desactivar"}
        </Boton>
      )}
    </section>
  );
}
