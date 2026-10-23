import type { Metadata } from "next";
import { RegistroSection } from "@/components/sections";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return <RegistroSection />;
}
