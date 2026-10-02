import type { MetadataRoute } from "next";

/** PWA: el panel se instala en el celular y recibe notificaciones push. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UPS Talent Ops",
    short_name: "Talent Ops",
    description: "Consola de referidos UPS: candidatos, bots y notificaciones",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#ffffff",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
