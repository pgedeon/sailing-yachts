import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sailing-yachts.vercel.app";

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
        <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <a
              href="/"
              className="text-xl font-bold text-primary tracking-tight"
            >
              Sailing Yachts
            </a>
            <nav className="flex items-center gap-6">
              <a
                href="/yachts"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Browse
              </a>
              <a
                href="/search"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Search
              </a>
              <a
                href="/compare"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Compare
              </a>
              <a
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </a>
            </nav>
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-border py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
            <p>
              © {new Date().getFullYear()} Sailing Yachts Database. All rights
              reserved.
            </p>
            <p className="mt-1">
              Data sourced from manufacturer specifications.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
