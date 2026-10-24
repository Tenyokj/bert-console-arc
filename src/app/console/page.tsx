import type { Metadata } from "next";
import { GraphConsole } from "@/components/GraphConsole";

export const metadata: Metadata = {
  title: "Query Studio",
  description:
    "Run read-only GraphQL queries against BERT Arc Testnet V2.3 and V3.2 subgraphs.",
  alternates: { canonical: "/console" },
};

export default function ConsolePage() {
  return <GraphConsole />;
}
