import type { Metadata } from "next";
import { AdminSection } from "@/components/sections";

export const metadata: Metadata = { title: "Panel de administración" };

export default function AdminPage() {
  return <AdminSection />;
}
