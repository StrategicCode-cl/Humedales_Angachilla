import type { Metadata } from "next";
import { MapaSection } from "@/components/sections";

export const metadata: Metadata = { title: "Mapa y senderos" };

export default function MapaPage() {
  return <MapaSection />;
}
