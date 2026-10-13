import type { Metadata } from "next";
import { EventosSection } from "@/components/sections";

export const metadata: Metadata = { title: "Eventos" };

export default function EventosPage() {
  return <EventosSection />;
}
