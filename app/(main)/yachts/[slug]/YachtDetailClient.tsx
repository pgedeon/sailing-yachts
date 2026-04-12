"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Ruler, Wind, Home, Wrench, Star, Printer } from "lucide-react";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import { PriceTierDetail } from "@/app/components/PriceTierBadge";
import { PriceInsightBlock } from "@/app/components/PriceInsightBlock";
import { calculatePriceTier } from "@/lib/price-tier";
import { slugify } from "@/lib/utils/slugify";
import { SimilarYachts } from "./SimilarYachts";
import { SameSizeAlternatives } from "./SameSizeAlternatives";
import { RelatedManufacturers } from "./RelatedManufacturers";
import { RelatedGuides } from "./RelatedGuides";
import { RelatedArticles } from "./RelatedArticles";
import AffiliateRecommendations from "@/app/components/AffiliateRecommendations";
import YachtImage from "@/app/components/yacht/YachtImage";
import { getAffiliateRecommendations } from "@/lib/affiliate-recommendations";

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
  }>;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  dimensions: <Ruler className="h-5 w-5" />,
  sailplan: <Wind className="h-5 w-5" />,
  accommodation: <Home className="h-5 w-5" />,
  technical: <Wrench className="h-5 w-5" />,
  performance: <Star className="h-5 w-5" />,
  other: null,
};

const GROUP_LABELS: Record<string, string> = {
  dimensions: "Dimensions",
  sailplan: "Sail Plan",
  accommodation: "Accommodation",
  technical: "Technical",
  performance: "Performance",
  hull: "Hull",
  other: "Other Specs",
};

export default function YachtDetailClient() {
  const params = useParams();
  const slug = params.slug as string;

  const [yacht, setYacht] = useState<YachtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/yachts/${slug}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error("Yacht not found");
        return r.json();
      })
      .then((data) => setYacht(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        Loading yacht…
      </div>
    );
  if (error)
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-red-600">
        Error: {error}
      </div>
    );
  if (!yacht) return null;

  const formatNumber = (num: number | null, decimals = 2) =>
    num !== null
      ? num.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : "—";

  const formatSpecValue = (value: number | string, unit?: string) => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "number") {
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
        <h1>Sailing Yachts Database — Spec Sheet</h1>
      </div>

      <nav aria-label="Breadcrumb" className="mb-4 sm:mb-6 no-print">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </li>
          <li>
            <Link href="/yachts" className="hover:text-foreground transition-colors">
              Yachts
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
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
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Browse
          </Link>
        </Button>
        <button
          onClick={handlePrint}
          className="print-spec-sheet-btn no-print inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
          data-testid="print-spec-sheet-btn"
          type="button"
        >
          <Printer className="h-4 w-4" />
          Print Spec Sheet
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
            />
          ) : (
            <div className="w-full h-56 sm:h-72 md:h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
        </div>
        <div>
          <div className="flex items-start gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {yacht.manufacturer} {yacht.modelName} ({yacht.year})
            </h1>
            <div className="no-print">
              <FavoriteButton slug={yacht.slug} modelName={`${yacht.manufacturer} ${yacht.modelName}`} size="lg" showLabel />
            </div>
          </div>
          <p className="text-base sm:text-lg text-muted-foreground mb-4">
            A sailing yacht built by {yacht.manufacturer}.
          </p>
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
                  Length Overall
                </div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.lengthOverall)} m
                </div>
              </div>
            )}
            {yacht.beam && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">Beam</div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.beam)} m
                </div>
              </div>
            )}
            {yacht.draft && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">Draft</div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {formatNumber(yacht.draft)} m
                </div>
              </div>
            )}
            {yacht.displacement && (
              <div className="bg-card border border-border rounded-lg p-3 sm:p-4 spec-item">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Displacement
                </div>
                <div className="text-xl sm:text-2xl font-semibold">
                  {(yacht.displacement / 1000).toFixed(1)} t
                </div>
              </div>
            )}
          </div>

          {/* Price Range Estimate */}
          <PriceTierDetail info={priceTierInfo} />

          {/* Real price data from DB (P8.2) */}
          <PriceInsightBlock yachtId={yacht.id} modelName={yacht.modelName} />

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
              Source:{" "}
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


      {/* Performance Ratios Section */}
      {(() => {
        const ratios = calculatePerformanceRatios(yacht);
        if (ratios.length === 0) return null;
        return (
          <section className="mt-10 sm:mt-12">
            <h2 className="text-lg sm:text-xl font-bold mb-4">Performance Ratios</h2>
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
        const recommendation = getBoatRecommendation(yacht);
        if (!recommendation) return null;
        return (
          <section className="mt-10 sm:mt-12 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-xl p-6">
            <h2 className="text-lg sm:text-xl font-bold mb-3 text-sky-900">Who is this boat for?</h2>
            <p className="text-muted-foreground leading-relaxed">{recommendation}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {yacht.lengthOverall && yacht.lengthOverall < 10 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Day Sailer</span>
              )}
              {yacht.lengthOverall && yacht.lengthOverall >= 10 && yacht.lengthOverall < 13 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Coastal Cruiser</span>
              )}
              {yacht.lengthOverall && yacht.lengthOverall >= 13 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Bluewater</span>
              )}
              {yacht.berths && yacht.berths >= 4 && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Family Friendly</span>
              )}
              {yacht.rigType?.toLowerCase().includes("sloop") && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">Easy Handling</span>
              )}
            </div>
          </section>
        );
      })()}
      {/* Reviews Section */}
      {yacht.reviews && yacht.reviews.length > 0 && (
        <section className="mt-10 sm:mt-12">
          <h2 className="text-lg sm:text-xl font-bold mb-4">Customer Reviews</h2>
          <div className="space-y-4">
            {yacht.reviews.map((review, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{review.source}</div>
                  {review.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
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

      {/* INTERNAL LINKING MODULES (P6.7) */}

      {/* 1. Compare with similar boats - already implemented as SimilarYachts */}
      <div className="similar-yachts-section no-print">
        <SimilarYachts slug={slug} />
      </div>

      {/* 2. Same size alternatives - NEW */}
      {yacht.lengthOverall && (
        <div className="same-size-alternatives-section no-print">
          <SameSizeAlternatives
            targetLength={yacht.lengthOverall}
            currentYachtId={yacht.id}
          />
        </div>
      )}

      {/* 3. More from this manufacturer - NEW */}
      {yacht.manufacturerId && (
        <div className="related-manufacturers-section no-print">
          <RelatedManufacturers
            manufacturerId={yacht.manufacturerId}
            manufacturerSlug={slugify(yacht.manufacturer)}
            currentYachtId={yacht.id}
          />
        </div>
      )}

      {/* 4. Related guides - NEW (Phase 7 placeholder) */}
      <div className="related-guides-section no-print">
        <RelatedGuides
          manufacturer={yacht.manufacturer}
          lengthOverall={yacht.lengthOverall}
          rigType={yacht.rigType}
        />
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
        />
      </div>

      {/* Affiliate Recommendations */}
      <div className="affiliate-recommendations-section no-print">
        <AffiliateRecommendations categories={affiliateRecommendations} />
      </div>

      {/* Compare Button */}
      <div className="compare-button-section mt-10 sm:mt-12 text-center no-print">
        <Button asChild size="lg">
          <Link href={`/compare?ids=${yacht.id}`}>Compare This Yacht</Link>
        </Button>
      </div>

      {/* Print-only footer */}
      <div className="print-footer hidden" data-testid="print-footer">
        Printed from info.sailboats.fr — {yacht.manufacturer} {yacht.modelName} ({yacht.year}) — {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

// Performance ratio calculations
function calculatePerformanceRatios(yacht: YachtData) {
  const ratios: { name: string; value: string; description: string }[] = [];
  
  const loa = yacht.lengthOverall;
  const disp = yacht.displacement;
  const ballast = yacht.ballast;
  const sailArea = yacht.sailAreaMain;
  
  // Displacement/Length ratio (D/L)
  if (loa && disp) {
    const dl = (disp / 2240) / Math.pow(loa / 100, 3);
    let dlDesc = dl < 100 ? "Ultra light (racing)" : dl < 200 ? "Light (performance cruiser)" : dl < 300 ? "Moderate (cruiser)" : "Heavy (bluewater cruiser)";
    ratios.push({ name: "Displacement/Length", value: dl.toFixed(1), description: dlDesc });
  }
  
  // Sail Area/Displacement ratio (SA/D)
  if (sailArea && disp) {
    const sad = (sailArea * 64) / Math.pow(disp / 64, 2/3);
    let sadDesc = sad < 16 ? "Under-canvased (easy handling)" : sad < 18 ? "Moderate (cruising)" : sad < 22 ? "Performance cruiser" : "High performance (racing)";
    ratios.push({ name: "Sail Area/Displacement", value: sad.toFixed(1), description: sadDesc });
  }
  
  // Ballast Ratio
  if (ballast && disp) {
    const br = (ballast / disp) * 100;
    let brDesc = br < 30 ? "Low (more heel, less stability)" : br < 40 ? "Moderate (good balance)" : "High (stiff, stable)";
    ratios.push({ name: "Ballast Ratio", value: `${br.toFixed(0)}%`, description: brDesc });
  }
  
  // Capsize Screening Formula (CSF)
  if (loa && disp) {
    const csf = loa / Math.pow(disp / 64, 1/3);
    let csfDesc = csf < 2 ? "Excellent offshore stability" : csf < 2.5 ? "Good coastal/offshore" : csf < 3 ? "Moderate (coastal)" : "High (light displacement, care needed offshore)";
    ratios.push({ name: "Capsize Screening", value: csf.toFixed(2), description: csfDesc });
  }
  
  return ratios;
}

// "Who is this boat for?" logic
function getBoatRecommendation(yacht: YachtData): string | null {
  const parts: string[] = [];
  const loa = yacht.lengthOverall || 0;
  const cabins = yacht.cabins || 0;
  const berths = yacht.berths || 0;
  const disp = yacht.displacement || 0;
  const rig = yacht.rigType?.toLowerCase() || "";
  
  if (loa < 9) {
    parts.push("ideal for day sailing and weekend trips");
  } else if (loa < 12) {
    parts.push("a versatile size for coastal cruising and occasional extended voyages");
  } else {
    parts.push("suited for extended cruising and bluewater passages");
  }
  
  if (berths >= 4 || cabins >= 3) {
    parts.push("family-friendly layout with generous accommodation");
  } else if (berths >= 2) {
    parts.push("comfortable for couples or small families");
  }
  
  if (disp > 5000 && loa > 10) {
    parts.push("solid construction inspires confidence in varied conditions");
  }
  
  if (rig.includes("ketch") || rig.includes("cutter") || rig.includes("sloop")) {
    parts.push("classic rig configuration offers proven handling characteristics");
  }
  
  return parts.length > 0 ? `This yacht is ${parts.join(", ")}.` : null;
}
