import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { ProtocolProvider } from "@/components/ProtocolProvider";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BERT Console | V0.1.0 Beta",
    template: "%s | BERT Console",
  },
  description:
    "Explore indexed BERT V2.3 funding and V3.2 community activity on Arc Testnet. Public read-only beta.",
  icons: { icon: "/bert-logo.png", apple: "/bert-logo.png" },
  openGraph: {
    title: "BERT Console | V0.1.0 Beta",
    description:
      "A public read-only view of BERT funding, communities, contracts and indexed activity on Arc Testnet.",
    url: siteUrl,
    siteName: "BERT Console",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ProtocolProvider>
          <AppShell>{children}</AppShell>
        </ProtocolProvider>
      </body>
    </html>
  );
}
