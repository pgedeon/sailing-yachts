import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sailing-yachts.vercel.app"),
  title: {
    default: "Sailing Yachts Database — Search & Compare Yacht Specs",
    template: "%s | Sailing Yachts",
  },
  description:
    "Comprehensive sailing yacht database. Search, compare specifications, and find the perfect sailboat from top manufacturers worldwide.",
  keywords: [
    "sailing yacht",
    "sailboat",
    "yacht specs",
    "boat comparison",
    "marine",
    "yacht database",
    "sailing yacht specifications",
  ],
  openGraph: {
    title: "Sailing Yachts Database",
    description:
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
    type: "website",
    siteName: "Sailing Yachts",
  },
  twitter: {
    card: "summary_large_image",
    site: "@sailingyachts",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sailing Yachts",
    url: "https://sailing-yachts.vercel.app",
    description:
      "Comprehensive sailing yacht database with search and comparison tools.",
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
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
