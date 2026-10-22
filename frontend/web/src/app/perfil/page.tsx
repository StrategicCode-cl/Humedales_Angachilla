import type { Metadata } from "next";
import { PerfilSection } from "@/components/sections";

export const metadata: Metadata = { title: "Tu perfil" };

export default function PerfilPage() {
  return <PerfilSection />;
}
