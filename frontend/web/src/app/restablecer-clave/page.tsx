import type { Metadata } from "next";
import { RestablecerClaveSection } from "@/components/sections";

export const metadata: Metadata = {
  title: "Nueva contraseña",
  // The link carries a one-time token: keep it out of search engines
  robots: { index: false, follow: false },
};

export default function RestablecerClavePage() {
  return <RestablecerClaveSection />;
}
