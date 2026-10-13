import type { Metadata } from "next";
import { BuzonSection } from "@/components/sections";

export const metadata: Metadata = { title: "Buzón ciudadano" };

export default function BuzonPage() {
  return <BuzonSection />;
}
