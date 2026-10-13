import type { Metadata } from "next";
import { EspeciesSection } from "@/components/sections";

export const metadata: Metadata = { title: "Biodiversidad" };

export default function EspeciesPage() {
  return <EspeciesSection />;
}
