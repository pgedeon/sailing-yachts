"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ArrowRight from "@/app/components/icons/ArrowRight";

interface RelatedYacht {
  id: number;
  slug: string | null;
  modelName: string;
  manufacturer: string;
  year: number;
  lengthOverall: number | null;
  primaryImage: string | null;
}

interface RelatedManufacturersProps {
  manufacturerId: number;
  manufacturerSlug: string;
  currentYachtId: number;
  limit?: number;
}

export function RelatedManufacturers({
  manufacturerId,
  manufacturerSlug,
  currentYachtId,
  limit = 3,
}: RelatedManufacturersProps) {
  const [yachts, setYachts] = useState<RelatedYacht[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYachts = async () => {
      try {
        const res = await fetch(
          `/api/yachts/manufacturer/${manufacturerId}?exclude=${currentYachtId}&limit=${limit}`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const data = await res.json();
          setYachts(data.yachts || []);
        }
      } catch (err) {
        console.error("Failed to fetch manufacturer yachts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchYachts();
  }, [manufacturerId, currentYachtId, limit]);

  if (loading) {
    return (
      <section className="mt-10 sm:mt-12" data-testid="related-manufacturers-section">
        <h2 className="text-lg sm:text-xl font-bold mb-4">More from this Manufacturer</h2>
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

  return (
    <section
      className="mt-10 sm:mt-12"
      data-testid="related-manufacturers-section"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold">
          More from this Manufacturer
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {yachts.map((yacht) => (
          <Link
            key={yacht.id}
            href={`/yachts/${yacht.slug}`}
            className="group block bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            data-testid="related-manufacturer-yacht-card"
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
                {formatLength(yacht.lengthOverall) && (
                  <span className="bg-muted px-2 py-0.5 rounded">
                    LOA {formatLength(yacht.lengthOverall)}
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center text-xs text-primary font-medium">
                View details
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
