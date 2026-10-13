import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const description =
  "Guía interactiva, navegación por senderos, escáner QR de hitos, catálogo de flora y fauna, sonidos de la naturaleza, panel de avisos y comunidad del Humedal Angachilla en Valdivia, Chile.";

export const metadata: Metadata = {
  title: {
    default: "Humedal Angachilla - Valdivia",
    template: "%s · Humedal Angachilla",
  },
  description,
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    title: "Humedal Angachilla - Valdivia",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: "#064e3b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${jakarta.variable} ${outfit.variable}`}>
      <body className="bg-stone-50 text-stone-900 antialiased selection:bg-emerald-500 selection:text-white font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
