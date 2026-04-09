import { BookOpen, ExternalLink } from "lucide-react";

/**
 * Related Guides Placeholder
 *
 * Phase 7 will implement a full content engine with MDX/CMS-backed editorial content.
 * This placeholder is here to prepare the UI and internal linking structure.
 *
 * Future implementation will:
 * - Query a guides API or content model
 * - Show relevant buying guides, glossary pages, and manufacturer spotlights
 * - Link naturally into yacht pages and comparison pages
 */

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
  return (
    <section
      className="mt-10 sm:mt-12 bg-gradient-to-r from-sky-50 via-white to-cyan-50 border border-sky-200 rounded-xl p-6"
      data-testid="related-guides-section"
    >
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-sky-700" />
        <h2 className="text-lg sm:text-xl font-bold text-sky-900">
          Buying Guides & Resources
        </h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Expert guides and resources to help you choose the right yacht.
      </p>

      {/* Placeholder content for Phase 7 */}
      <div className="space-y-3">
        {lengthOverall && (
          <a
            href="/"
            className="block p-3 rounded-lg border border-sky-100 bg-white/80 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sky-900">
                  {lengthOverall < 10
                    ? "Best Day Sailers Under 10 Meters"
                    : lengthOverall < 13
                    ? "Best Coastal Cruisers 10-13 Meters"
                    : "Best Bluewater Cruisers Over 13 Meters"}
                </div>
                <div className="text-xs text-sky-600 mt-1">
                  Size-based buying guide
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-sky-600" />
            </div>
          </a>
        )}

        {rigType && (
          <a
            href="/"
            className="block p-3 rounded-lg border border-sky-100 bg-white/80 hover:bg-white hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sky-900">
                  {rigType.toLowerCase().includes("cutter")
                    ? "Cutter Rig vs Sloop: Which is Right for You?"
                    : "Understanding Sailboat Rig Types"}
                </div>
                <div className="text-xs text-sky-600 mt-1">
                  Rig configuration guide
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-sky-600" />
            </div>
          </a>
        )}

        <a
          href="/"
          className="block p-3 rounded-lg border border-sky-100 bg-white/80 hover:bg-white hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sky-900">
                Sailing Glossary: LOA, Beam, Draft, and More
              </div>
              <div className="text-xs text-sky-600 mt-1">
                Common terminology explained
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-sky-600" />
          </div>
        </a>
      </div>

      <p className="text-xs text-sky-600 mt-4 italic">
        Full guides library coming in Phase 7 — Content Engine & Authority Building
      </p>
    </section>
  );
}
