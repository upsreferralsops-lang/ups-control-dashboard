"use client";

import { useEffect } from "react";

/**
 * PWA: registra el service worker en cualquier pantalla del panel. Sin esto
 * el navegador no ofrece "Instalar" y no hay a quien entregarle el push.
 * Registrarlo de nuevo en cada carga no hace nada si ya existe.
 */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
