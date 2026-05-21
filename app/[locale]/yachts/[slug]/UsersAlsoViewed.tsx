"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import YachtImage from "@/app/components/yacht/YachtImage";
import { useLocale } from "next-intl";

interface AlsoViewedYacht {
  id: number;
  manufacturer: string;
  modelName: string;
  slug: string;
  year: number;
  lengthOverall: number | null;
  primaryImage: string | null;
  viewCount: number;
}

interface UsersAlsoViewedProps {
  slug: string;
}

export function UsersAlsoViewed({ slug }: UsersAlsoViewedProps) {
  const locale = useLocale();
  const t = useTranslations("YachtDetailSub");
  const [yachts, setYachts] = useState<AlsoViewedYacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/yachts/${slug}/also-viewed`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setYachts(data.yachts || []);
        setLoading(false);
      })
      .catch(() => {
        setYachts([]);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <section className="mt-8 sm:mt-10" data-testid="users-also-viewed-section">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg sm:text-xl font-bold">{t("usersAlsoViewed")}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 w-40 h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (yachts.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-10" data-testid="users-also-viewed-section">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <h2 className="text-lg sm:text-xl font-bold">{t("usersAlsoViewed")}</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={localePath(locale, `/yachts/${yacht.slug}`)}
            className="flex-shrink-0 w-40 sm:w-48 group"
            data-testid="also-viewed-card"
          >
            <div className="h-28 sm:h-32 bg-muted rounded-lg overflow-hidden relative">
              {yacht.primaryImage ? (
                <YachtImage
                  src={yacht.primaryImage}
                  alt={`${yacht.manufacturer} ${yacht.modelName}`}
                  fill
                  className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                  sizes="192px"
                  aria-hidden="true"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  {t("noImage")}
                </div>
              )}
            </div>
            <div className="mt-2">
              <p className="text-xs sm:text-sm font-medium leading-tight group-hover:text-primary transition-colors">
                {yacht.manufacturer} {yacht.modelName}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {yacht.lengthOverall && (
                  <span>{Number(yacht.lengthOverall).toFixed(1)}m</span>
                )}
                <span className="opacity-50">·</span>
                <span>{yacht.year}</span>
                <ArrowRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
