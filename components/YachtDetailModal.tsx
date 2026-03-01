"use client";

"use client";

import { useEffect } from "react";

interface SpecGroup {
  [group: string]: Array<{
    category: string;
    value: number | string;
    unit?: string;
  }>;
}

interface YachtImage {
  url: string;
  caption?: string;
  altText?: string;
  isPrimary: boolean;
}

interface YachtReview {
  source: string;
  rating: number | null;
  summary: string | null;
  fullText?: string | null;
  reviewDate?: string | null;
  authorName?: string | null;
  sourceUrl?: string | null;
}

interface Yacht {
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
  sailAreaMain: number | null | undefined;
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
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
  specsByGroup?: SpecGroup;
  images?: YachtImage[];
  reviews?: YachtReview[];
  adminLinks?: Array<{ url: string; label?: string }>;
}

interface YachtDetailModalProps {
  yacht: Yacht | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GROUP_LABELS: Record<string, string> = {
  dimensions: "Dimensions",
  sailplan: "Sail Plan",
  accommodation: "Accommodation",
  technical: "Technical",
  performance: "Performance",
  hull: "Hull",
  other: "Other Specs",
};

export default function YachtDetailModal({
  yacht,
  open,
  onOpenChange,
}: YachtDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onOpenChange]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  if (!yacht) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-background rounded-lg p-6">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const close = () => onOpenChange(false);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">
              {yacht.manufacturer} {yacht.modelName} ({yacht.year})
            </h2>
            <p className="text-sm text-muted-foreground">
              Comprehensive specifications and details
            </p>
          </div>
          <button
            onClick={close}
            className="text-2xl leading-none hover:text-foreground/70"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Left column: Image & basic specs */}
          <div className="space-y-6">
            {yacht.images && yacht.images.length > 0 ? (
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={
                    yacht.images.find((img) => img.isPrimary)?.url ||
                    yacht.images[0].url
                  }
                  alt={
                    yacht.images.find((img) => img.isPrimary)
                      ?.altText || `${yacht.manufacturer} ${yacht.modelName}`
                  }
                  className="w-full h-64 object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}

            {/* Quick core specs as cards */}
            <div className="grid grid-cols-2 gap-4">
              {yacht.lengthOverall && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Length Overall</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const n = Number(yacht.lengthOverall);
                      return isNaN(n) ? String(yacht.lengthOverall) : `${n.toFixed(2)} m`;
                    })()}
                  </div>
                </div>
              )}
              {yacht.beam && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Beam</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const n = Number(yacht.beam);
                      return isNaN(n) ? String(yacht.beam) : `${n.toFixed(2)} m`;
                    })()}
                  </div>
                </div>
              )}
              {yacht.draft && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Draft</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const n = Number(yacht.draft);
                      return isNaN(n) ? String(yacht.draft) : `${n.toFixed(2)} m`;
                    })()}
                  </div>
                </div>
              )}
              {yacht.displacement && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Displacement</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const n = Number(yacht.displacement);
                      return isNaN(n) ? String(yacht.displacement) : `${(n / 1000).toFixed(1)} t`;
                    })()}
                  </div>
                </div>
              )}
              {yacht.sailAreaMain && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Sail Area Main</div>
                  <div className="text-lg font-semibold">
                    {(() => {
                      const n = Number(yacht.sailAreaMain);
                      return isNaN(n) ? String(yacht.sailAreaMain) : `${n.toFixed(1)} m²`;
                    })()}
                  </div>
                </div>
              )}
              {yacht.cabins && (
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground">Cabins</div>
                  <div className="text-lg font-semibold">{yacht.cabins}</div>
                </div>
              )}
            </div>

            {/* Description */}
            {yacht.description && (
              <div className="prose prose-sm max-w-none">
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{yacht.description}</p>
              </div>
            )}
          </div>

          {/* Right column: Full specs, images, reviews */}
          <div className="space-y-6">
            {/* Specs by group */}
            {yacht.specsByGroup && Object.keys(yacht.specsByGroup).length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Specifications</h4>
                <div className="space-y-6">
                  {Object.entries(yacht.specsByGroup).map(([group, specs]) => (
                    <div key={group}>
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">
                        {GROUP_LABELS[group] || group}
                      </h5>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {specs.map((spec, idx) => (
                          <div key={idx}>
                            <div className="text-muted-foreground text-xs">
                              {spec.category}
                            </div>
                            <div>
                              {spec.value !== null && spec.value !== undefined
                                ? (() => {
                                    const n = Number(spec.value);
                                    return isNaN(n) ? String(spec.value) : `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${spec.unit ?? ""}`.trim();
                                  })()
                                : "—"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Basic fields not in groups */}
            {(yacht.rigType || yacht.keelType || yacht.hullMaterial || yacht.berths || yacht.heads || yacht.maxOccupancy || yacht.engineHp || yacht.engineType || yacht.fuelCapacity || yacht.waterCapacity) && (
              <div>
                <h4 className="font-semibold mb-3">Additional Details</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {yacht.rigType && (
                    <>
                      <dt className="text-muted-foreground">Rig Type</dt>
                      <dd>{yacht.rigType}</dd>
                    </>
                  )}
                  {yacht.keelType && (
                    <>
                      <dt className="text-muted-foreground">Keel Type</dt>
                      <dd>{yacht.keelType}</dd>
                    </>
                  )}
                  {yacht.hullMaterial && (
                    <>
                      <dt className="text-muted-foreground">Hull Material</dt>
                      <dd>{yacht.hullMaterial}</dd>
                    </>
                  )}
                  {yacht.berths && (
                    <>
                      <dt className="text-muted-foreground">Berths</dt>
                      <dd>{yacht.berths}</dd>
                    </>
                  )}
                  {yacht.heads && (
                    <>
                      <dt className="text-muted-foreground">Heads</dt>
                      <dd>{yacht.heads}</dd>
                    </>
                  )}
                  {yacht.maxOccupancy && (
                    <>
                      <dt className="text-muted-foreground">Max Occupancy</dt>
                      <dd>{yacht.maxOccupancy}</dd>
                    </>
                  )}
                  {yacht.engineHp != null && (
                    <>
                      <dt className="text-muted-foreground">Engine HP</dt>
                      <dd>{(() => {
                        const n = Number(yacht.engineHp);
                        return isNaN(n) ? String(yacht.engineHp) : n.toFixed(0);
                      })()}</dd>
                    </>
                  )}
                  {yacht.engineType && (
                    <>
                      <dt className="text-muted-foreground">Engine Type</dt>
                      <dd>{yacht.engineType}</dd>
                    </>
                  )}
                  {yacht.fuelCapacity && (
                    <>
                      <dt className="text-muted-foreground">Fuel Capacity</dt>
                      <dd>{yacht.fuelCapacity.toLocaleString()} L</dd>
                    </>
                  )}
                  {yacht.waterCapacity && (
                    <>
                      <dt className="text-muted-foreground">Water Capacity</dt>
                      <dd>{yacht.waterCapacity.toLocaleString()} L</dd>
                    </>
                  )}
                </dl>
              </div>
            )}

            {/* Reviews */}
            {yacht.reviews && yacht.reviews.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Reviews</h4>
                <div className="space-y-4">
                  {yacht.reviews.map((review, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">{review.source}</div>
                        {review.rating && (
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-500">★</span>
                            <span>{(() => {
                              const n = Number(review.rating);
                              return isNaN(n) ? String(review.rating) : n.toFixed(1);
                            })()}</span>
                          </div>
                        )}
                      </div>
                      {review.summary && (
                        <p className="font-medium text-sm">{review.summary}</p>
                      )}
                      {review.fullText && (
                        <p className="text-sm text-muted-foreground mt-1">{review.fullText}</p>
                      )}
                      {review.authorName && (
                        <p className="text-xs text-muted-foreground mt-2">
                          — {review.authorName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin links */}
            {yacht.adminLinks && yacht.adminLinks.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Admin Links</h4>
                <div className="flex flex-wrap gap-2">
                  {yacht.adminLinks.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Source */}
            {yacht.sourceUrl && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                Source:{" "}
                <a
                  href={yacht.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {yacht.sourceAttribution || yacht.sourceUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
