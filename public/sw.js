/*
 * Service worker de la PWA del panel. Solo notificaciones push: el panel no
 * funciona sin conexion (sus datos viven en el core), asi que no cachea nada.
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(datos.title || "UPS Talent Ops", {
      body: datos.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: datos.url || "/notificaciones" },
      // Un aviso por destino: si el mismo candidato escribe de nuevo, se reemplaza.
      tag: datos.url || undefined,
      renotify: Boolean(datos.url),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      // Si el panel ya esta abierto, se reutiliza esa ventana.
      for (const ventana of ventanas) {
        if (ventana.url.startsWith(self.location.origin) && "focus" in ventana) {
          return ventana.navigate(url).then((v) => (v || ventana).focus());
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
