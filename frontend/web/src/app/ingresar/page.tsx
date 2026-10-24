import type { Metadata } from "next";
import { IngresarSection } from "@/components/sections";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function IngresarPage() {
  return <IngresarSection />;
}
