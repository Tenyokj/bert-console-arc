import type { Metadata } from "next";
import { FundingPage } from "@/components/ExplorerPages";

export const metadata: Metadata = {
  title: "V2.3 Funding",
  description:
    "Explore indexed BERT V2.3 ideas, rounds, pledges and grant execution on Arc Testnet.",
  alternates: { canonical: "/funding" },
};

export default function Page() {
  return <FundingPage />;
}
