import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Consola de referidos",
  description: "Operacion de referidos UPS: candidatos, bots y estados",
  // iPhone: instalada desde "Agregar a inicio" abre como app (y recibe push).
  appleWebApp: { capable: true, title: "Talent Ops", statusBarStyle: "default" },
  icons: { apple: "/apple-touch-icon.png" },
};

// Barra del navegador/sistema del color de la barra superior del panel.
export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
