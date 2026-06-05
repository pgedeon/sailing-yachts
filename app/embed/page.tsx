import type { Metadata } from "next";
import EmbedConfiguratorClient from "./EmbedConfiguratorClient";

export const metadata: Metadata = {
  title: "Embed Yacht Comparison Widget | Sailing Yacht Info",
  description:
    "Create an embeddable yacht comparison widget for your website or blog. Choose yachts, customize layout, and get the embed code.",
  robots: { index: true, follow: true },
};

export default function EmbedPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";
  return <EmbedConfiguratorClient siteUrl={siteUrl} />;
}
