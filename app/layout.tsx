import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import WebVitals from "@/components/WebVitals";
import AuthProvider from "./providers";
import { getAllFlags } from "@/lib/feature-flags";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales } from "@/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sailing Yacht Info — Specs, Comparison & Reviews",
    template: "%s | Sailing Yacht Info",
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
  authors: [{ name: "Sailing Yacht Info" }],
  creator: "Sailing Yacht Info",
  publisher: "Sailing Yacht Info",
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
    siteName: "Sailing Yacht Info",
    title: "Sailing Yacht Info — Specs, Comparison & Reviews",
    description:
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sailing Yacht Info — Specs, Comparison & Reviews",
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

function resolveLocale(cookieValue: string | undefined, pathname: string): string {
  // Try cookie first (set by next-intl middleware on previous requests)
  if (cookieValue && locales.includes(cookieValue as typeof locales[number])) {
    return cookieValue;
  }
  // Fall back to URL path: /fr/... → "fr"
  const match = pathname.match(/^\/([a-z]{2})(?:\/|$|\?)/);
  if (match && locales.includes(match[1] as typeof locales[number])) {
    return match[1];
  }
  return defaultLocale;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The root layout is above the [locale] segment so getLocale() may return
  // the default locale if the layout shell is cached. We resolve the locale
  // from the NEXT_LOCALE cookie (set by next-intl middleware) with a URL
  // pathname fallback for first-time visitors.
  const cookieStore = await cookies();
  const headersList = await headers();
  const pathname =
    headersList.get("x-invoke-path") ||
    headersList.get("x-next-url") ||
    headersList.get("x-vercel-url") ||
    "";
  const locale = resolveLocale(cookieStore.get("NEXT_LOCALE")?.value, pathname);
  const featureFlags = getAllFlags();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={cn(inter.variable, "antialiased min-h-screen bg-background")}
      >
        <AuthProvider featureFlags={featureFlags}>
          <WebVitals />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
