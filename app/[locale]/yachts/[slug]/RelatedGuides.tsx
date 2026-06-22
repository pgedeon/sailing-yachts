"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale} from "next-intl";
import { BookOpen, ExternalLink } from "lucide-react";
import { localePath } from "@/lib/i18n-paths";

interface RelatedGuide {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  readingTimeMinutes: number | null;
  buyingGuideTemplateId: string | null;
}

interface RelatedGuidesProps {
  manufacturer?: string;
  lengthOverall?: number | null;
  rigType?: string | null;
}

export function RelatedGuides({
  manufacturer,
  lengthOverall,
  rigType,
}: RelatedGuidesProps) {
  const locale = useLocale();
  const t = useTranslations("YachtDetailSub");
  const [guides, setGuides] = useState<RelatedGuide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (manufacturer) params.set("manufacturer", manufacturer);
    if (lengthOverall) params.set("lengthOverall", String(lengthOverall));
    if (rigType) params.set("rigType", rigType);

    fetch(`/api/related-guides?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setGuides(data.guides || []);
      })
      .catch(() => setGuides([]))
      .finally(() => setLoading(false));
  }, [manufacturer, lengthOverall, rigType]);

  if (loading) {
    return (
      <section
        className="mt-10 sm:mt-12 bg-linear-to-r from-sky-50 via-white to-cyan-50 border border-sky-200 rounded-xl p-6"
        data-testid="related-guides-section"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-bold text-sky-900">
            {t("buyingGuides")}
          </h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border border-sky-100 bg-white/60 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (guides.length === 0) {
    // Fallback: link to guides hub
    return (
      <section
        className="mt-10 sm:mt-12 bg-linear-to-r from-sky-50 via-white to-cyan-50 border border-sky-200 rounded-xl p-6"
        data-testid="related-guides-section"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-sky-700" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-bold text-sky-900">
            {t("buyingGuides")}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("guidesFallback")}
        </p>
        <a
          href={localePath(locale, "/guides")}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900 transition"
        >
          {t("browseAllGuides")}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    );
  }

  return (
    <section
      className="mt-10 sm:mt-12 bg-linear-to-r from-sky-50 via-white to-cyan-50 border border-sky-200 rounded-xl p-6"
      data-testid="related-guides-section"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-sky-700" aria-hidden="true" />
        <h2 className="text-lg sm:text-xl font-bold text-sky-900">
          {t("buyingGuides")}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t("guidesRelated")}
      </p>
      <div className="space-y-3">
        {guides.map((guide) => (
          <a
            key={guide.id}
            href={localePath(locale, `/guides/${guide.slug}`)}
            className="block p-3 rounded-lg border border-sky-100 bg-white/80 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-sky-900 truncate">
                  {guide.title}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {guide.category && (
                    <span className="text-xs text-sky-600">
                      {guide.category
                        .split("-")
                        .map(
                          (w) => w.charAt(0).toUpperCase() + w.slice(1)
                        )
                        .join(" ")}
                    </span>
                  )}
                  {guide.readingTimeMinutes && (
                    <span className="text-xs text-sky-500">
                      {t("minRead", { minutes: guide.readingTimeMinutes })}
                    </span>
                  )}
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-sky-600 shrink-0" aria-hidden="true" />
            </div>
          </a>
        ))}
      </div>
      <a
        href={localePath(locale, "/guides")}
        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 mt-4 transition"
      >
        {t("viewAllGuides")}
      </a>
    </section>
  );
}
