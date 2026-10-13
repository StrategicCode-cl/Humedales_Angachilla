import type { Metadata } from "next";
import { GaleriaSection } from "@/components/sections";

export const metadata: Metadata = { title: "Galería" };

export default function GaleriaPage() {
  return <GaleriaSection />;
}
