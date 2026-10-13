import type { Metadata } from "next";
import { DeploymentsPage } from "@/components/ExplorerPages";

export const metadata: Metadata = {
  title: "Deployments",
  description:
    "View BERT Arc Testnet contract addresses and live proxy implementations.",
  alternates: { canonical: "/deployments" },
};

export default function Page() {
  return <DeploymentsPage />;
}
