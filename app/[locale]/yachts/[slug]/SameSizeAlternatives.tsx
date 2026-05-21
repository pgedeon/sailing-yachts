"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import ArrowRight from "@/app/components/icons/ArrowRight";
import { useLocale } from "next-intl";

interface SameSizeYacht {
  id: number;
  slug: string | null;
  modelName: string;
  manufacturer: string;
  year: number;
  lengthOverall: number | null;
  beam: number | null;
  displacement: number | null;
  primaryImage: string | null;
}

interface SameSizeAlternativesProps {
  targetLength: number;
  currentYachtId: number;
  limit?: number;
}

export function SameSizeAlternatives({
  targetLength,
  currentYachtId,
  limit = 3,
}: SameSizeAlternativesProps) {
  const locale = useLocale();
  const t = useTranslations("YachtDetailSub");
  const [yachts, setYachts] = useState<SameSizeYacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const marginMeters = 1.0; // ±1 meter window
        const minLength = targetLength - marginMeters;
        const maxLength = targetLength + marginMeters;

        const res = await fetch(
          `/api/yachts?minLength=${minLength}&maxLength=${maxLength}&exclude=${currentYachtId}&limit=${limit}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setYachts(data.yachts || []);
        }
      } catch (err) {
        console.error("Failed to fetch same-size alternatives:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchYachts();
  }, [targetLength, currentYachtId, limit]);

  if (loading) {
    return (
      <section className="mt-10 sm:mt-12" data-testid="same-size-alternatives-section">
        <h2 className="text-lg sm:text-xl font-bold mb-4">{t("sameSizeAlternatives")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (yachts.length === 0) return null;

  const formatLength = (val: number | null) =>
    val !== null ? `${Number(val).toFixed(1)}m` : null;
  const formatNumber = (val: string | null, decimals = 1) => {
    if (!val) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n.toFixed(decimals);
  };

  return (
    <section
      className="mt-10 sm:mt-12"
      data-testid="same-size-alternatives-section"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">{t("sameSizeAlternatives")}</h2>
        <span className="text-sm text-muted-foreground">
          {t("withinRange")}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={localePath(locale, `/yachts/${yacht.slug}`)}
            className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            data-testid="same-size-yacht-card"
          >
            {/* Image */}
            {yacht.primaryImage ? (
              <div className="h-36 sm:h-40 bg-muted overflow-hidden">
                <img
                  src={yacht.primaryImage}
                  alt={`${yacht.manufacturer} ${yacht.modelName}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ) : (
              <div className="h-36 sm:h-40 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                {t("noImage")}
              </div>
            )}

            {/* Content */}
            <div className="p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                {yacht.manufacturer} {yacht.modelName} ({yacht.year})
              </h3>

              {/* Quick specs */}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {formatLength(yacht.lengthOverall) && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    LOA {formatLength(yacht.lengthOverall)}
                  </span>
                )}
                {formatNumber(String(yacht.beam)) && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Beam {formatNumber(String(yacht.beam))}m
                  </span>
                )}
                {yacht.displacement && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    {(parseFloat(String(yacht.displacement)) / 1000).toFixed(1)}t
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center text-xs text-primary font-medium">
                {t("viewDetails")}
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
