"use client";

import { useState } from "react";
import { Shield, ExternalLink, Calendar, Database, ChevronDown, ChevronUp } from "lucide-react";
import CompletenessBadge from "@/components/CompletenessBadge";

interface SourceProvenanceProps {
  dataSource: string | null;
  sourceUrl: string | null;
  sourceAttribution: string | null;
  sourceConfidence: number | null;
  lastVerifiedAt: string | null;
  completenessScore: number | null;
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  manual: "Manual entry",
  manufacturer: "Manufacturer website",
  manufacturer_website: "Manufacturer website",
  user_submitted: "User submitted",
  user: "User submitted",
  imported: "Data import",
  scrape: "Web scrape",
  api: "API feed",
  editor: "Editor review",
};

function getDataSourceLabel(source: string | null): string {
  if (!source) return "Unknown source";
  return DATA_SOURCE_LABELS[source.toLowerCase()] || source.charAt(0).toUpperCase() + source.slice(1).replace(/_/g, " ");
}

function getConfidenceLabel(confidence: number | null): { label: string; color: string; width: string } {
  if (confidence === null) return { label: "Unknown", color: "bg-gray-300", width: "w-0" };
  const pct = Math.min(100, Math.max(0, confidence));
  if (pct >= 80) return { label: "High", color: "bg-green-500", width: "w-4/5" };
  if (pct >= 50) return { label: "Medium", color: "bg-yellow-500", width: "w-3/5" };
  return { label: "Low", color: "bg-red-400", width: "w-1/5" };
}

function formatDate(iso: string | null): string {
  if (!iso) return "Not yet verified";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function SourceProvenance({
  dataSource,
  sourceUrl,
  sourceAttribution,
  sourceConfidence,
  lastVerifiedAt,
  completenessScore,
}: SourceProvenanceProps) {
  const [expanded, setExpanded] = useState(false);

  const confidence = getConfidenceLabel(sourceConfidence);
  const sourceLabel = getDataSourceLabel(dataSource);

  return (
    <section
      className="mt-8 border border-border rounded-lg bg-card"
      data-testid="source-provenance"
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left hover:bg-muted/50 transition-colors rounded-lg"
        aria-expanded={expanded}
        data-testid="source-provenance-toggle"
      >
        <div className="flex items-center gap-2 text-sm sm:text-base font-semibold">
          <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <span>Data Source &amp; Quality</span>
          {completenessScore !== null && (
            <CompletenessBadge score={completenessScore} size="sm" />
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 space-y-4">
          {/* Completeness Score */}
          {completenessScore !== null && (
            <div className="flex items-center gap-3">
              <Database className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <CompletenessBadge score={completenessScore} size="md" showLabel />
                <span className="text-sm text-muted-foreground">
                  Data completeness: {completenessScore}%
                </span>
              </div>
            </div>
          )}

          {/* Source */}
          <div className="flex items-start gap-3">
            <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <span className="text-sm text-muted-foreground">Source:</span>{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm underline text-foreground hover:text-foreground/80"
                >
                  {sourceAttribution || "View source"}
                </a>
              ) : (
                <span className="text-sm">
                  {sourceAttribution || "Manufacturer data"}
                </span>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="flex items-center gap-3">
            <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Source confidence: {confidence.label}
              </span>
              {sourceConfidence !== null && (
                <div className="flex-1 max-w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${confidence.color}`}
                    style={{ width: `${Math.min(100, Math.max(0, sourceConfidence))}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Last Verified */}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Last verified:{" "}
              <span className={lastVerifiedAt ? "text-foreground" : "italic"}>
                {formatDate(lastVerifiedAt)}
              </span>
            </span>
          </div>

          {/* Data Source Type */}
          <div className="flex items-center gap-3">
            <Database className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">
              Data source: <span className="text-foreground">{sourceLabel}</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
