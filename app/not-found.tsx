import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default async function RootNotFound() {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="text-8xl font-bold text-primary/20">404</div>
            <h1 className="text-2xl font-semibold text-foreground">
              Page Not Found
            </h1>
            <p className="text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Go to homepage
              </Link>
              <Link
                href="/yachts"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Browse yachts
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
