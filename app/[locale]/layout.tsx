import Link from "next/link";
import HeaderAuthControls from "@/components/HeaderAuthControls";
import { generateSiteNavigationJsonLd } from "@/lib/seo";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LocaleHtmlUpdater from "@/components/LocaleHtmlUpdater";
import { ClientNav } from "./ClientNav";
import UXPolish from "@/components/UXPolish";
import AnalyticsPageTracker from "@/components/AnalyticsPageTracker";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}


export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout(props: LayoutProps) {
  const params = await props.params;

  const {
    children
  } = props;

  const { locale } = params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering for next-intl (avoids headers() call)
  setRequestLocale(locale);

  // Providing all messages to the client side
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: "Layout" });

  const navItems = [
    { nameKey: "browse", path: `/${locale}/yachts` },
    { nameKey: "manufacturers", path: `/${locale}/manufacturers` },
    { nameKey: "guides", path: `/${locale}/guides` },
    { nameKey: "glossary", path: `/${locale}/glossary` },
    { nameKey: "faq", path: `/${locale}/faq` },
    { nameKey: "search", path: `/${locale}/search` },
    { nameKey: "compare", path: `/${locale}/compare` },
  ];

  return (
    <NextIntlClientProvider locale={locale} messages={messages} now={new Date()} timeZone="Europe/Berlin">
      {/* Client-side locale updater: sets <html lang> to the correct locale */}
      <LocaleHtmlUpdater locale={locale} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateSiteNavigationJsonLd(
              navItems.map((item) => ({
                name: t(`nav.${item.nameKey}`),
                path: item.path,
              }))
            )
          ),
        }}
      />
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-gray-900 focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:border focus:border-blue-500 focus:outline-none"
      >
        {t("skipToContent")}
      </a>
      <header role="banner" className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href={`/${locale}`}
              className="text-xl font-bold text-primary tracking-tight flex-shrink-0"
            >
              {t("siteName")}
            </Link>

            {/* Desktop nav — client component for active link styling */}
            <div className="hidden md:flex items-center gap-6">
              <nav aria-label="Main navigation" className="flex items-center gap-6">
                {navItems.map((item) => (
                  <Link
                    key={item.nameKey}
                    href={item.path}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t(`nav.${item.nameKey}`)}
                  </Link>
                ))}
              </nav>
              <LanguageSwitcher locale={locale} />
              <HeaderAuthControls />
            </div>

            {/* Mobile hamburger */}
            <ClientNav locale={locale} navItems={navItems} />
          </div>
        </div>
      </header>
      <main id="main-content" role="main" className="min-h-screen">
        {children}
      </main>
      <footer role="contentinfo" className="border-t border-border py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <p className="mt-1">
            {t("footer.dataSource")}
          </p>
          <p className="mt-2 text-xs">
            {t("footer.builtByPrefix")}{" "}
            <a href="https://3dput.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              {t("footer.builtBy3dput")}
            </a>{" "}
            {t("footer.builtBySeparator")}{" "}
            <a href="https://sailboats.fr" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              {t("footer.builtBySailboats")}
            </a>
          </p>
        </div>
      </footer>
      <UXPolish />
      <AnalyticsPageTracker />
    </NextIntlClientProvider>
  );
}
