import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Panel de referidos UPS",
  description: "Seguimiento de candidatos, referidos y lista de espera",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-6 px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-amber-500 text-sm font-bold text-slate-900">
                U
              </span>
              <span className="text-sm font-semibold tracking-tight">
                Panel de referidos
              </span>
            </Link>
            <span className="ml-auto font-[family-name:var(--font-mono)] text-xs text-slate-500 dark:text-slate-400">
              Warehouse · Driver Helper · SSD
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
