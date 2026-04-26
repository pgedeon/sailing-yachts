"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n";

interface LanguageSwitcherProps {
  locale: string;
}

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();

  // Replace the current locale prefix in the pathname with the target locale
  function getLocalizedPath(targetLocale: Locale) {
    const segments = pathname.split("/");
    if (segments.length > 1 && (segments[1] === "en" || segments[1] === "fr")) {
      segments[1] = targetLocale;
    } else {
      segments.splice(1, 0, targetLocale);
    }
    return segments.join("/");
  }

  const targetLocale = locale === "en" ? "fr" : "en";

  return (
    <Link
      href={getLocalizedPath(targetLocale as Locale)}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      lang={targetLocale}
      title={t("switchTo", { language: t(targetLocale) })}
    >
      <span className="text-sm" aria-hidden="true">
        {locale === "en" ? "🇫🇷" : "🇬🇧"}
      </span>
      <span>{t(targetLocale)}</span>
    </Link>
  );
}
