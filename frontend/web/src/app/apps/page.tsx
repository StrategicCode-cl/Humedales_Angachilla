import type { Metadata } from "next";
import { AppsSection } from "@/components/sections";

export const metadata: Metadata = {
  title: "Apps Complementarias",
};

export default function AppsPage() {
  return <AppsSection />;
}
