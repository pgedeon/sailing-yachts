"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { LeadForm } from "@/app/components/LeadForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ruler, Wind, Home, Wrench, Star, Printer } from "lucide-react";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { PriceTierDetail } from "@/app/components/PriceTierBadge";
import { PriceInsightBlock } from "@/app/components/PriceInsightBlock";
import { calculatePriceTier } from "@/lib/price-tier";
import { slugify } from "@/lib/utils/slugify";
import ManufacturerLogo from "@/components/manufacturer-logo";
import { SimilarYachts } from "./SimilarYachts";
import { SameSizeAlternatives } from "./SameSizeAlternatives";
import { RelatedManufacturers } from "./RelatedManufacturers";
import { RelatedGuides } from "./RelatedGuides";
import { RelatedArticles } from "./RelatedArticles";
import AffiliateRecommendations from "@/app/components/AffiliateRecommendations";
import YachtImage from "@/app/components/yacht/YachtImage";
import { getAffiliateRecommendations } from "@/lib/affiliate-recommendations";
import CompletenessBadge from "@/components/CompletenessBadge";
import MediaGallery from "@/components/MediaGallery";
import { calculateCompletenessScore } from "@/lib/completeness";
import SourceProvenance from "@/components/SourceProvenance";
import { ReviewSummary } from "@/components/ReviewSummary";
import { ReviewSubmissionForm } from "@/components/ReviewSubmissionForm";
import { CorrectionForm } from "@/components/CorrectionForm";
import dynamic from "next/dynamic";

const SpecBarsChart = dynamic(
  () => import("@/components/spec-bars-chart").then((m) => ({ default: m.SpecBarsChart })),
  { ssr: false, loading: () => null },
);

interface SpecGroup {
  [group: string]: Array<{
    category: string;
    value: number | string;
    unit?: string;
  }>;
}

interface YachtData {
  id: number;
  manufacturer: string;
  manufacturerId: number | null;
  manufacturerLogoUrl: string | null;
  modelName: string;
  year: number;
  slug: string;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
  designNotes: string | null;
  description: string | null;
  adminLinks: Array<{ label: string; url: string }> | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  dataSource: string | null;
  sourceConfidence: number | null;
  lastVerifiedAt: string | null;
  completenessScore: number | null;
  specsByGroup: SpecGroup;
  images: Array<{
    url: string;
    caption?: string;
    altText?: string;
    isPrimary: boolean;
  }>;
  reviews: Array<{
    source: string;
    rating: number | null;
    summary: string | null;
    fullText: string | null;
    reviewDate: string | null;
    authorName: string | null;
    sourceUrl: string | null;
    reviewType?: string | null;
    verified?: boolean | null;
    ratingBreakdown?: {
      build_quality: number | null;
      sailing_performance: number | null;
      comfort: number | null;
      value_for_money: number | null;
    } | null;
    pros?: string[] | null;
    cons?: string[] | null;
    helpfulCount?: number | null;
  }>;
  mediaAssets?: Array<{
    id: number;
    mediaType: string;
    title: string | null;
    description: string | null;
    url: string | null;
    embedUrl: string | null;
    thumbnailUrl: string | null;
    sourceUrl: string | null;
    fileFormat: string | null;
    fileSize: number | null;
    caption: string | null;
    altText: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  dimensions: <Ruler className="h-5 w-5" aria-hidden="true" />,
  sailplan: <Wind className="h-5 w-5" aria-hidden="true" />,
  accommodation: <Home className="h-5 w-5" aria-hidden="true" />,
  technical: <Wrench className="h-5 w-5" aria-hidden="true" />,
  performance: <Star className="h-5 w-5" aria-hidden="true" />,
  other: null,
};

export default function YachtDetailClient() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations("YachtDetail");

  const [yacht, setYacht] = useState<YachtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Translation-aware GROUP_LABELS
  const GROUP_LABELS: Record<string, string> = {
    dimensions: t("groupLabels.dimensions"),
    sailplan: t("groupLabels.sailplan"),
    accommodation: t("groupLabels.accommodation"),
    technical: t("groupLabels.technical"),
    performance: t("groupLabels.performance"),
    hull: t("groupLabels.hull"),
    other: t("groupLabels.other"),
  };

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/yachts/${slug}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(t("notFound.heading"));
        return r.json();
      })
      .then((data) => setYacht(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, t]);

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        {t("loading")}
      </div>
    );
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-600">
        {t("error", { message: error })}
      </div>
    );
  if (!yacht) return null;

  const formatNumber = (num: number | string | null, decimals = 2) =>
    num !== null
      ? Number(num).toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : "—";

  const formatSpecValue = (value: number | string, unit?: string) => {
    if (value === null || value === undefined) return "—";
    const numVal = Number(value);
    if (!isNaN(numVal) && value !== "") {
      return `${formatNumber(value)} ${unit || ""}`.trim();
    }
    return value;
  };

  // Calculate price tier
  const priceTierInfo = calculatePriceTier({
    lengthOverall: yacht.lengthOverall,
    displacement: yacht.displacement,
    beam: yacht.beam,
    cabins: yacht.cabins,
    hullMaterial: yacht.hullMaterial,
    keelType: yacht.keelType,
    rigType: yacht.rigType,
  });

  // Get affiliate recommendations
  const affiliateRecommendations = getAffiliateRecommendations({
    lengthOverall: yacht.lengthOverall,
    displacement: yacht.displacement,
    beam: yacht.beam,
    cabins: yacht.cabins,
    hullMaterial: yacht.hullMaterial,
    keelType: yacht.keelType,
    rigType: yacht.rigType,
    priceTier: priceTierInfo.tier,
  });

  // Primary image
  const primaryImage =
    yacht.images.find((img) => img.isPrimary) || yacht.images[0];

  return (
    <div className="yacht-detail-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Print-only header */}
      <div className="print-header hidden" data-testid="print-header">
        <h1>{t("printHeader")}</h1>
      </div>

      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 no-print">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              {t("breadcrumb.home")}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </li>
          <li>
            <Link href="/yachts" className="hover:text-foreground transition-colors">
              {t("breadcrumb.yachts")}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </li>
          <li>
            <Link
              href={`/manufacturers/${slugify(yacht.manufacturer)}`}
              className="hover:text-foreground transition-colors"
            >
              {yacht.manufacturer}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </li>
          <li aria-current="page" className="text-foreground font-medium">
            {yacht.modelName}
          </li>
        </ol>
      </nav>

      {/* Back link + Print button */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="no-print">
          <Link href="/yachts">
            <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
            {t("backToBrowse")}
          </Link>
        </Button>
        <button
          onClick={handlePrint}
          className="print-spec-sheet-btn no-print inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          data-testid="print-spec-sheet-btn"
          type="button"
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          {t("printSpecSheet")}
        </button>
      </div>

      {/* Hero */}
      <div className="yacht-hero grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
        <div>
          {primaryImage ? (
            <YachtImage
              src={primaryImage.url}
              alt={
                primaryImage.altText ||
                `${yacht.manufacturer} ${yacht.modelName}`
              }
              fill
              className="w-full h-56 sm:h-72 md:h-80 rounded-lg"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              aria-hidden="true" />
          ) : (
            <div className="w-full h-56 sm:h-72 md:h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              {t("noImage")}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {yacht.manufacturer} {yacht.modelName} ({yacht.year})
            </h1>
            <div className="no-print">
              <FavoriteButton slug={yacht.slug} modelName={`${yacht.manufacturer} ${yacht.modelName}`} size="lg" showLabel aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <CompletenessBadge score={calculateCompletenessScore(yacht)} size="md" showLabel aria-hidden="true" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <ManufacturerLogo name={yacht.manufacturer} logoUrl={yacht.manufacturerLogoUrl ?? null} size={32} />
            <p className="text-base sm:text-lg text-muted-foreground">
              {t("builtBy", { manufacturer: yacht.manufacturer })}
            </p>
          </div>
          {yacht.description && (
            <p className="text-muted-foreground mb-4 leading-relaxed text-sm sm:text-base">
              {yacht.description}
            </p>
          )}

          {/* Core specs quick view */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 my-4 sm:my-6">
            {yacht.lengthOverall && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t("coreSpecs.lengthOverall")}
                </div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.lengthOverall)} m
                </div>
              </div>
            )}
            {yacht.beam && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">{t("coreSpecs.beam")}</div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.beam)} m
                </div>
              </div>
            )}
            {yacht.draft && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">{t("coreSpecs.draft")}</div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.draft)} m
                </div>
              </div>
            )}
            {yacht.displacement && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  {t("coreSpecs.displacement")}
                </div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {(Number(yacht.displacement) / 1000).toFixed(1)} t
                </div>
              </div>
            )}
          </div>

          {/* Price Range Estimate */}
          <PriceTierDetail info={priceTierInfo} aria-hidden="true" />

          {/* Real price data from DB (P8.2) */}
          <PriceInsightBlock yachtId={yacht.id} modelName={yacht.modelName} aria-hidden="true" />

          {/* Admin links */}
          {yacht.adminLinks && yacht.adminLinks.length > 0 && (
            <div className="admin-links flex flex-wrap gap-2 sm:gap-3 mt-4 no-print">
              {yacht.adminLinks.map((link, idx) => (
                <Button key={idx} asChild variant="outline" size="sm">
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </Button>
              ))}
            </div>
          )}

          {yacht.sourceUrl && (
            <p className="text-xs text-muted-foreground mt-4">
              {t("sourceLabel")}{" "}
              <a
                href={yacht.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {yacht.sourceAttribution || yacht.sourceUrl}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Media Gallery (P10.2) */}
      {yacht.mediaAssets && yacht.mediaAssets.length > 0 && (
        <MediaGallery mediaAssets={yacht.mediaAssets} aria-hidden="true" />
      )}

      {/* Specs by Group */}
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(yacht.specsByGroup).map(([group, specs]) => {
          const label = GROUP_LABELS[group] || group;
          const icon = GROUP_ICONS[group];
          return (
            <section key={group} className="spec-group">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                {icon}
                <h2 className="text-lg sm:text-xl font-bold">{label}</h2>
              </div>
              <div className="spec-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="spec-item bg-card border border-border rounded-lg p-3 sm:p-4"
                  >
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {spec.category}
                    </div>
                    <div className="text-base sm:text-lg font-medium mt-1">
                      {formatSpecValue(spec.value, spec.unit)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>



      {/* P15.2: Spec Bars Visualization */}
      <SpecBarsChart
        yachtSpecs={{
          lengthOverall: yacht.lengthOverall,
          beam: yacht.beam,
          draft: yacht.draft,
          displacement: yacht.displacement,
          ballast: yacht.ballast,
          sailAreaMain: yacht.sailAreaMain,
          engineHp: yacht.engineHp,
        }}
      />

      {/* Source Provenance (P10.3) */}
      <SourceProvenance
        dataSource={yacht.dataSource}
        sourceUrl={yacht.sourceUrl}
        sourceAttribution={yacht.sourceAttribution}
        sourceConfidence={yacht.sourceConfidence}
        lastVerifiedAt={yacht.lastVerifiedAt}
        completenessScore={yacht.completenessScore}
        aria-hidden="true" />

      {/* User Correction (P10.7) */}
      <CorrectionForm
        yachtId={yacht.id}
        yachtSlug={yacht.slug}
        specFields={[
          { name: "lengthOverall", label: t("correctionFields.lengthOverall"), currentValue: yacht.lengthOverall },
          { name: "beam", label: t("correctionFields.beam"), currentValue: yacht.beam },
          { name: "draft", label: t("correctionFields.draft"), currentValue: yacht.draft },
          { name: "displacement", label: t("correctionFields.displacement"), currentValue: yacht.displacement },
          { name: "ballast", label: t("correctionFields.ballast"), currentValue: yacht.ballast },
          { name: "sailAreaMain", label: t("correctionFields.sailAreaMain"), currentValue: yacht.sailAreaMain },
          { name: "rigType", label: t("correctionFields.rigType"), currentValue: yacht.rigType },
          { name: "keelType", label: t("correctionFields.keelType"), currentValue: yacht.keelType },
          { name: "hullMaterial", label: t("correctionFields.hullMaterial"), currentValue: yacht.hullMaterial },
          { name: "cabins", label: t("correctionFields.cabins"), currentValue: yacht.cabins },
          { name: "berths", label: t("correctionFields.berths"), currentValue: yacht.berths },
          { name: "heads", label: t("correctionFields.heads"), currentValue: yacht.heads },
          { name: "maxOccupancy", label: t("correctionFields.maxOccupancy"), currentValue: yacht.maxOccupancy },
          { name: "engineHp", label: t("correctionFields.engineHp"), currentValue: yacht.engineHp },
          { name: "engineType", label: t("correctionFields.engineType"), currentValue: yacht.engineType },
          { name: "fuelCapacity", label: t("correctionFields.fuelCapacity"), currentValue: yacht.fuelCapacity },
          { name: "waterCapacity", label: t("correctionFields.waterCapacity"), currentValue: yacht.waterCapacity },
        ].filter(f => f.currentValue !== null && f.currentValue !== undefined)}
      />

      {/* Performance Ratios Section */}
      {(() => {
        const ratios = calculatePerformanceRatios(yacht, t);
        if (ratios.length === 0) return null;
        return (
          <section className="mt-10 sm:mt-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4">{t("performance.heading")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ratios.map((ratio) => (
                <div key={ratio.name} className="border border-border rounded-lg p-4 bg-card">
                  <div className="text-sm text-muted-foreground">{ratio.name}</div>
                  <div className="text-2xl font-bold mt-1">{ratio.value}</div>
                  <div className="text-xs text-muted-foreground mt-2">{ratio.description}</div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* Who is this boat for? Section */}
      {(() => {
        const recommendation = getBoatRecommendation(yacht, t);
        if (!recommendation) return null;
        return (
          <section className="mt-10 sm:mt-12 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-xl p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-sky-900">{t("recommendation.heading")}</h2>
            <p className="text-muted-foreground leading-relaxed">{recommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {yacht.lengthOverall && yacht.lengthOverall < 10 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{t("badges.daySailer")}</span>
              )}
              {yacht.lengthOverall && yacht.lengthOverall >= 10 && yacht.lengthOverall < 13 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{t("badges.coastalCruiser")}</span>
              )}
              {yacht.lengthOverall && yacht.lengthOverall >= 13 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{t("badges.bluewater")}</span>
              )}
              {yacht.berths && yacht.berths >= 4 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{t("badges.familyFriendly")}</span>
              )}
              {yacht.rigType?.toLowerCase().includes("sloop") && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{t("badges.easyHandling")}</span>
              )}
            </div>
          </section>
        );
      })()}
      {/* Review Summary (P10.4) */}
      {yacht.reviews && yacht.reviews.length > 0 && (() => {
        const validRatings = yacht.reviews
          .map(r => Number(r.rating))
          .filter(n => !isNaN(n) && n > 0);
        const overallRating = validRatings.length > 0
          ? validRatings.reduce((a: number, b: number) => a + b, 0) / validRatings.length
          : 0;
        const breakdowns = yacht.reviews
          .map(r => r.ratingBreakdown)
          .filter(Boolean);
        const avgBreakdown = {
          build_quality: 0,
          sailing_performance: 0,
          comfort: 0,
          value_for_money: 0,
        };
        if (breakdowns.length > 0) {
          for (const b of breakdowns) {
            avgBreakdown.build_quality += Number(b!.build_quality) || 0;
            avgBreakdown.sailing_performance += Number(b!.sailing_performance) || 0;
            avgBreakdown.comfort += Number(b!.comfort) || 0;
            avgBreakdown.value_for_money += Number(b!.value_for_money) || 0;
          }
          const countB = (field: keyof typeof avgBreakdown) =>
            breakdowns.filter(b => b![field] !== null).length;
          const safeAvg = (sum: number, field: keyof typeof avgBreakdown) => {
            const c = countB(field);
            return c > 0 ? sum / c : 0;
          };
          avgBreakdown.build_quality = safeAvg(avgBreakdown.build_quality, 'build_quality');
          avgBreakdown.sailing_performance = safeAvg(avgBreakdown.sailing_performance, 'sailing_performance');
          avgBreakdown.comfort = safeAvg(avgBreakdown.comfort, 'comfort');
          avgBreakdown.value_for_money = safeAvg(avgBreakdown.value_for_money, 'value_for_money');
        }
        return (
          <div className="mt-10 sm:mt-12">
            <ReviewSummary
              reviews={yacht.reviews}
              overallRating={overallRating}
              ratingBreakdown={avgBreakdown}
              aria-hidden="true" />
          </div>
        );
      })()}

      {/* Reviews Section */}
      {yacht.reviews && yacht.reviews.length > 0 && (
        <section className="mt-6 sm:mt-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4">{t("reviews.heading")}</h2>
          <div className="space-y-4">
            {yacht.reviews.map((review, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">{review.authorName || review.source}</span>
                    {review.reviewType && review.reviewType !== 'expert' && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {review.reviewType.replace('_', ' ')}
                      </span>
                    )}
                    {review.verified && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {t("reviews.verified")}
                      </span>
                    )}
                  </div>
                  {review.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                      <span>{parseFloat(String(review.rating)).toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {review.summary && (
                  <p className="mt-2 font-medium">{review.summary}</p>
                )}
                {review.fullText && (
                  <p className="mt-1 text-muted-foreground text-sm">
                    {review.fullText}
                  </p>
                )}
                {(review.pros && review.pros.length > 0) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {review.pros.map((pro, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-xs text-green-700">+ {pro}</span>
                    ))}
                  </div>
                )}
                {(review.cons && review.cons.length > 0) && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {review.cons.map((con, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-xs text-red-700">− {con}</span>
                    ))}
                  </div>
                )}
                {review.authorName && (
                  <p className="text-xs text-muted-foreground mt-2">
                    — {review.authorName}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Review Submission Form (P10.4) */}
      <div className="mt-8 sm:mt-10 no-print">
        <ReviewSubmissionForm
          yachtModelId={yacht.id}
          yachtName={`${yacht.manufacturer} ${yacht.modelName}`}
          aria-hidden="true" />
      </div>

      {/* INTERNAL LINKING MODULES (P6.7) */}

      {/* 1. Compare with similar boats - already implemented as SimilarYachts */}
      <div className="similar-yachts-section no-print">
        <SimilarYachts slug={slug} aria-hidden="true" />
      </div>

      {/* 2. Same size alternatives - NEW */}
      {yacht.lengthOverall && (
        <div className="same-size-alternatives-section no-print">
          <SameSizeAlternatives
            targetLength={yacht.lengthOverall}
            currentYachtId={yacht.id}
            aria-hidden="true" />
        </div>
      )}

      {/* 3. More from this manufacturer - NEW */}
      {yacht.manufacturerId && (
        <div className="related-manufacturers-section no-print">
          <RelatedManufacturers
            manufacturerId={yacht.manufacturerId}
            manufacturerSlug={slugify(yacht.manufacturer)}
            currentYachtId={yacht.id}
            aria-hidden="true" />
        </div>
      )}

      {/* Best value cross-link */}
      {yacht.lengthOverall && (() => {
        const loa = yacht.lengthOverall;
        let bestValueSlug = "";
        let bestValueLabel = "";
        if (loa >= 11.5 && loa <= 12.8) { bestValueSlug = "40ft-cruisers"; bestValueLabel = "Best Value 40ft Cruisers"; }
        else if (loa >= 10.0 && loa < 11.5) { bestValueSlug = "35ft-sailboats"; bestValueLabel = "Best Value 35ft Sailboats"; }
        else if (loa >= 10.5 && loa <= 13.7) { bestValueSlug = "family-cruisers-under-45ft"; bestValueLabel = "Best Value Family Cruisers Under 45ft"; }
        else if (loa >= 10.0 && loa <= 15.0) { bestValueSlug = "bluewater-value"; bestValueLabel = "Best Value Bluewater Sailboats"; }
        return bestValueSlug ? (
          <div className="best-value-cross-link no-print max-w-7xl mx-auto px-4 mb-8" data-testid="best-value-cross-link">
            <a
              href={`/best-value/${bestValueSlug}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition"
            >
              <span>🏆</span>
              {t("bestValue.seeRanked", { label: bestValueLabel })}
              <span>→</span>
            </a>
          </div>
        ) : null;
      })()}

      {/* 4. Related guides - NEW (Phase 7 placeholder) */}
      <div className="related-guides-section no-print">
        <RelatedGuides
          manufacturer={yacht.manufacturer}
          lengthOverall={yacht.lengthOverall}
          rigType={yacht.rigType}
          aria-hidden="true" />
      </div>

      {/* Related Sailing Articles from sailboats.fr */}
      <div className="related-articles-wrapper no-print">
        <RelatedArticles
          manufacturer={yacht.manufacturer}
          lengthOverall={yacht.lengthOverall}
          rigType={yacht.rigType}
          keelType={yacht.keelType}
          hullMaterial={yacht.hullMaterial}
          cabins={yacht.cabins}
          displacement={yacht.displacement}
          aria-hidden="true" />
      </div>

      {/* Lead Forms */}
      <div className="lead-forms-section mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <LeadForm yachtIds={[yacht.id]} leadType="dealer_inquiry" yachtName={`${yacht.manufacturer} ${yacht.modelName}`} aria-hidden="true" />
        <LeadForm yachtIds={[yacht.id]} leadType="price_request" yachtName={`${yacht.manufacturer} ${yacht.modelName}`} aria-hidden="true" />
      </div>

      {/* Affiliate Recommendations */}
      <div className="affiliate-recommendations-section no-print">
        <AffiliateRecommendations categories={affiliateRecommendations} aria-hidden="true" />
      </div>

      {/* Compare Button */}
      <div className="compare-button-section mt-10 sm:mt-12 text-center no-print">
        <Button asChild size="lg">
          <Link href={`/compare?ids=${yacht.id}`}>{t("compare")}</Link>
        </Button>
      </div>

      {/* Print-only footer */}
      <div className="print-footer hidden" data-testid="print-footer">
        {t("printFooter", {
          manufacturer: yacht.manufacturer,
          model: yacht.modelName,
          year: yacht.year,
          date: new Date().toLocaleDateString(),
        })}
      </div>
    </div>
  );
}

// Performance ratio calculations
function calculatePerformanceRatios(yacht: YachtData, t: (key: string, params?: Record<string, string | number>) => string) {
  const ratios: { name: string; value: string; description: string }[] = [];

  const loa = Number(yacht.lengthOverall) || null;
  const disp = Number(yacht.displacement) || null;
  const ballast = Number(yacht.ballast) || null;
  const sailArea = Number(yacht.sailAreaMain) || null;

  // Displacement/Length ratio (D/L)
  if (loa && disp) {
    const dl = (disp / 2240) / Math.pow(loa / 100, 3);
    let dlDesc = dl < 100 ? t("performance.dlUltraLight") : dl < 200 ? t("performance.dlLight") : dl < 300 ? t("performance.dlModerate") : t("performance.dlHeavy");
    ratios.push({ name: t("performance.displacementLength"), value: dl.toFixed(1), description: dlDesc });
  }

  // Sail Area/Displacement ratio (SA/D)
  if (sailArea && disp) {
    const sad = (sailArea * 64) / Math.pow(disp / 64, 2/3);
    let sadDesc = sad < 16 ? t("performance.sadUnderCanvased") : sad < 18 ? t("performance.sadModerate") : sad < 22 ? t("performance.sadPerformance") : t("performance.sadHighPerformance");
    ratios.push({ name: t("performance.sailAreaDisplacement"), value: sad.toFixed(1), description: sadDesc });
  }

  // Ballast Ratio
  if (ballast && disp) {
    const br = (ballast / disp) * 100;
    let brDesc = br < 30 ? t("performance.ballastLow") : br < 40 ? t("performance.ballastModerate") : t("performance.ballastHigh");
    ratios.push({ name: t("performance.ballastRatio"), value: `${br.toFixed(0)}%`, description: brDesc });
  }

  // Capsize Screening Formula (CSF)
  if (loa && disp) {
    const csf = loa / Math.pow(disp / 64, 1/3);
    let csfDesc = csf < 2 ? t("performance.csfExcellent") : csf < 2.5 ? t("performance.csfGood") : csf < 3 ? t("performance.csfModerate") : t("performance.csfHigh");
    ratios.push({ name: t("performance.capsizeScreening"), value: csf.toFixed(2), description: csfDesc });
  }

  return ratios;
}

// "Who is this boat for?" logic
function getBoatRecommendation(yacht: YachtData, t: (key: string, params?: Record<string, string | number>) => string): string | null {
  const parts: string[] = [];
  const loa = Number(yacht.lengthOverall) || 0;
  const cabins = yacht.cabins || 0;
  const berths = yacht.berths || 0;
  const disp = Number(yacht.displacement) || 0;
  const rig = yacht.rigType?.toLowerCase() || "";

  if (loa < 9) {
    parts.push(t("recommendation.daySailing"));
  } else if (loa < 12) {
    parts.push(t("recommendation.coastalCruising"));
  } else {
    parts.push(t("recommendation.bluewater"));
  }

  if (berths >= 4 || cabins >= 3) {
    parts.push(t("recommendation.familyFriendly"));
  } else if (berths >= 2) {
    parts.push(t("recommendation.couples"));
  }

  if (disp > 5000 && loa > 10) {
    parts.push(t("recommendation.solidConstruction"));
  }

  if (rig.includes("ketch") || rig.includes("cutter") || rig.includes("sloop")) {
    parts.push(t("recommendation.classicRig"));
  }

  return parts.length > 0 ? t("recommendation.template", { parts: parts.join(", ") }) : null;
}
