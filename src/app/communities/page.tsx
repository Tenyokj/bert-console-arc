import type { Metadata } from "next";
import { CommunitiesPage } from "@/components/ExplorerPages";

export const metadata: Metadata = {
  title: "V3.1 Communities",
  description:
    "Explore BERT V3.1 communities, proposals, slate rounds and milestone execution on Arc Testnet.",
  alternates: { canonical: "/communities" },
};

export default function Page() {
  return <CommunitiesPage />;
}
