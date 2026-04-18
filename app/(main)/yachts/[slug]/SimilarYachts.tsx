"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import YachtImage from "@/app/components/yacht/YachtImage";

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
  score: number;
  primaryImage: string | null;
}

interface SimilarYachtsProps {
  slug: string;
  initialData?: SimilarYacht[];
}

export function SimilarYachts({ slug, initialData }: SimilarYachtsProps) {
  const [yachts, setYachts] = useState<SimilarYacht[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialData) return;
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
  }, [slug, initialData]);

  if (loading) {
    return (
      <section className="mt-10 sm:mt-12" data-testid="similar-yachts-section">
        <h2 className="text-lg sm:text-xl font-bold mb-4">Similar Yachts</h2>
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
        <h2 className="text-lg sm:text-xl font-bold">Similar Yachts</h2>
        <span className="text-sm text-muted-foreground">
          Based on comparable specifications
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={`/yachts/${yacht.slug}`}
            className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            data-testid="similar-yacht-card"
          >
            {/* Image */}
            {yacht.primaryImage ? (
              <div className="h-36 sm:h-40 bg-muted overflow-hidden">
                <YachtImage
                  src={yacht.primaryImage}
                  alt={`${yacht.manufacturer} ${yacht.modelName}`}
                  fill
                  className="w-full h-full group-hover:scale-105 transition-transform duration-200"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="h-36 sm:h-40 bg-muted flex items-center justify-center text-muted-foreground text-sm">
                No image
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

              {/* Match score */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.round(yacht.score * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {Math.round(yacht.score * 100)}% match
                </span>
              </div>

              <div className="mt-2 flex items-center text-xs text-primary font-medium">
                View details
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
