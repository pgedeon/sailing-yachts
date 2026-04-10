import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import WebVitals from "@/components/WebVitals";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sailing Yachts Database — Specs, Comparison & Reviews",
    template: "%s | Sailing Yachts Database",
  },
  description:
    "Search and compare sailing yacht specifications from top manufacturers worldwide. Browse detailed specs, dimensions, sail plans, and accommodation details.",
  keywords: [
    "sailing yacht",
    "sailboat",
    "yacht specs",
    "boat comparison",
    "marine",
    "yacht database",
    "sailing boat specifications",
    "yacht dimensions",
    "sailboat reviews",
    "boat finder",
  ],
  authors: [{ name: "Sailing Yachts Database" }],
  creator: "Sailing Yachts Database",
  publisher: "Sailing Yachts Database",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Sailing Yachts Database",
    title: "Sailing Yachts Database — Specs, Comparison & Reviews",
    description:
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sailing Yachts Database — Specs, Comparison & Reviews",
    description:
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
  },
  alternates: {
    canonical: siteUrl,
  },
  verification: {
    other: {
      "msvalidate.01": "E3805C6DCA17BD4113B7C4F49D1C8F02",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(inter.variable, "antialiased min-h-screen bg-background")}
      >
        <WebVitals />
        {children}
      </body>
    </html>
  );
}
