"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Ruler, Wind, Home, Wrench, Star } from "lucide-react";

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

export default function YachtDetailPage() {
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

  // Primary image
  const primaryImage =
    yacht.images.find((img) => img.isPrimary) || yacht.images[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/yachts">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Browse
          </Link>
        </Button>
      </div>

      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <div>
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={
                primaryImage.altText ||
                `${yacht.manufacturer} ${yacht.modelName}`
              }
              className="w-full h-80 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-80 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              No image available
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {yacht.manufacturer} {yacht.modelName} ({yacht.year})
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            A sailing yacht built by {yacht.manufacturer}.
          </p>
          {yacht.description && (
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {yacht.description}
            </p>
          )}

          {/* Core specs quick view */}
          <div className="grid grid-cols-2 gap-4 my-6">
            {yacht.lengthOverall && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  Length Overall
                </div>
                <div className="text-2xl font-semibold">
                  {formatNumber(yacht.lengthOverall)} m
                </div>
              </div>
            )}
            {yacht.beam && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Beam</div>
                <div className="text-2xl font-semibold">
                  {formatNumber(yacht.beam)} m
                </div>
              </div>
            )}
            {yacht.draft && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">Draft</div>
                <div className="text-2xl font-semibold">
                  {formatNumber(yacht.draft)} m
                </div>
              </div>
            )}
            {yacht.displacement && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  Displacement
                </div>
                <div className="text-2xl font-semibold">
                  {(yacht.displacement / 1000).toFixed(1)} t
                </div>
              </div>
            )}
          </div>

          {/* Admin links */}
          {yacht.adminLinks && yacht.adminLinks.length > 0 && (
            <div className="flex gap-3 mt-4">
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
      <div className="space-y-8">
        {Object.entries(yacht.specsByGroup).map(([group, specs]) => {
          const label = GROUP_LABELS[group] || group;
          const icon = GROUP_ICONS[group];
          return (
            <section key={group}>
              <div className="flex items-center gap-2 mb-4">
                {icon}
                <h2 className="text-xl font-bold">{label}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {specs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="text-sm text-muted-foreground">
                      {spec.category}
                    </div>
                    <div className="text-lg font-medium mt-1">
                      {formatSpecValue(spec.value, spec.unit)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Reviews Section (if any) */}
      {yacht.reviews && yacht.reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold mb-4">Customer Reviews</h2>
          <div className="space-y-4">
            {yacht.reviews.map((review, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{review.source}</div>
                  {review.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{review.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                {review.summary && (
                  <p className="mt-2 font-medium">{review.summary}</p>
                )}
                {review.fullText && (
                  <p className="mt-1 text-muted-foreground">
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

      {/* Compare Button */}
      <div className="mt-12 text-center">
        <Button asChild size="lg">
          <Link href={`/compare?ids=${yacht.id}`}>Compare This Yacht</Link>
        </Button>
      </div>
    </div>
  );
}
