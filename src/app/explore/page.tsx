import type { Metadata } from "next";
import { DataCatalog } from "@/components/DataCatalog";

export const metadata: Metadata = {
  title: "Data Explorer",
  description:
    "Browse paginated BERT V2.3 and V3.2 indexed records on Arc Testnet.",
  alternates: { canonical: "/explore" },
};

export default function ExplorePage() {
  return <DataCatalog />;
}
