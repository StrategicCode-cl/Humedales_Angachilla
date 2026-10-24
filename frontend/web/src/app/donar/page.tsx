import type { Metadata } from "next";
import { DonarSection } from "@/components/sections";

export const metadata: Metadata = {
  title: "Donar",
  description: "Aporta al cuidado de la Reserva Comunitaria Bosque Humedal Angachilla, en Valdivia.",
};

export default function DonarPage() {
  return <DonarSection />;
}
