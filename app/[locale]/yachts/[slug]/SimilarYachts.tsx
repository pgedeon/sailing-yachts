"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import YachtImage from "@/app/components/yacht/YachtImage";
import { useLocale } from "next-intl";

interface MatchFactor {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

interface SimilarYacht {
  id: number;
  manufacturer: string | null;
  modelName: string;
  slug: string | null;
  year: number;
  lengthOverall: string | null;
  beam: string | null;
  draft: string | null;
  displacement: string | null;
  rigType: string | null;
  keelType: string | null;
  cabins: number | null;
  berths: number | null;
  score: number;
  factors: MatchFactor[];
  primaryImage: string | null;
}

interface SimilarYachtsProps {
  slug: string;
}

function ScoreBadge({ score }: { score: number }) {
  const locale = useLocale();
  let bg = "bg-muted text-muted-foreground";
  if (score >= 80) bg = "bg-emerald-100 text-emerald-800";
  else if (score >= 60) bg = "bg-sky-100 text-sky-800";
  else if (score >= 40) bg = "bg-amber-100 text-amber-800";
  else bg = "bg-orange-100 text-orange-800";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${bg}`}>
      {score}%
    </span>
  );
}

function FactorBar({ factor, t }: { factor: MatchFactor; t: (key: string) => string }) {
  const pct = factor.max > 0 ? Math.round((factor.score / factor.max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{t(factor.label)}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-sky-500' : 'bg-amber-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{factor.detail}</p>
    </div>
  );
}

function WhyTooltip({ factors, t }: { factors: MatchFactor[]; t: (key: string) => string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        aria-expanded={open}
        aria-label={t("whyRecommended")}
        data-testid="why-recommended-btn"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
        {t("whyRecommended")}
      </button>
      {open && (
        <div
          className="absolute z-20 bottom-full mb-2 left-0 w-64 bg-popover border border-border rounded-lg shadow-lg p-3 space-y-3"
          data-testid="why-tooltip"
        >
          <p className="text-xs font-semibold">{t("matchFactors")}</p>
          {factors.map((f) => (
            <FactorBar key={f.key} factor={f} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SimilarYachts({ slug }: SimilarYachtsProps) {
  const t = useTranslations("YachtDetailSub");
  const [yachts, setYachts] = useState<SimilarYacht[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/yachts/${slug}/similar`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        setYachts(data.similar || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <section className="mt-10 sm:mt-12" data-testid="similar-yachts-section">
        <h2 className="text-lg sm:text-xl font-bold mb-4">{t("similarYachts")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (error || yachts.length === 0) return null;

  const formatNum = (val: string | null, decimals = 1) => {
    if (!val) return null;
    const n = parseFloat(val);
    return isNaN(n) ? null : n.toFixed(decimals);
  };

  return (
    <section className="mt-10 sm:mt-12" data-testid="similar-yachts-section">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">{t("similarYachts")}</h2>
        <span className="text-sm text-muted-foreground">
          {t("basedOnSpecs")}
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={localePath(locale, `/yachts/${yacht.slug}`)}
            className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            data-testid="similar-yacht-card"
          >
            {/* Image */}
            {yacht.primaryImage ? (
              <div className="h-36 sm:h-40 bg-muted overflow-hidden relative">
                <YachtImage
                  src={yacht.primaryImage}
                  alt={`${yacht.manufacturer} ${yacht.modelName}`}
                  fill
                  className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  aria-hidden="true" />
                {/* Score badge overlay */}
                <div className="absolute top-2 right-2">
                  <ScoreBadge score={yacht.score} />
                </div>
              </div>
            ) : (
              <div className="h-36 sm:h-40 bg-muted flex items-center justify-center text-muted-foreground text-sm relative">
                {t("noImage")}
                <div className="absolute top-2 right-2">
                  <ScoreBadge score={yacht.score} />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-3 sm:p-4">
              <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                {yacht.manufacturer} {yacht.modelName} ({yacht.year})
              </h3>

              {/* Quick specs */}
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {formatNum(yacht.lengthOverall) && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    LOA {formatNum(yacht.lengthOverall)}m
                  </span>
                )}
                {formatNum(yacht.beam) && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    Beam {formatNum(yacht.beam)}m
                  </span>
                )}
                {yacht.displacement && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    {(parseFloat(yacht.displacement) / 1000).toFixed(1)}t
                  </span>
                )}
              </div>

              {/* Match bar + why tooltip */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${yacht.score >= 70 ? 'bg-emerald-500' : yacht.score >= 50 ? 'bg-sky-500' : 'bg-amber-500'}`}
                    style={{ width: `${yacht.score}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t("matchPercent", { percent: yacht.score })}
                </span>
              </div>

              {/* Why recommended tooltip trigger */}
              <div className="mt-2 flex items-center justify-between">
                <div onClick={(e) => e.preventDefault()}>
                  <WhyTooltip factors={yacht.factors} t={t} />
                </div>
                <span className="flex items-center text-xs text-primary font-medium">
                  {t("viewDetails")}
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
