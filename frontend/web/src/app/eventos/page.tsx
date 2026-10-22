import type { Metadata } from "next";
import { EventosSection } from "@/components/sections";

export const metadata: Metadata = { title: "Calendario" };

export default function EventosPage() {
  return <EventosSection />;
}
