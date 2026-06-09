'use client';

import { ExternalLink } from 'lucide-react';

interface ReviewSourceAggregation {
  sourceId: number;
  sourceName: string;
  sourceSlug: string;
  sourceType: string;
  sourceLogoUrl: string | null;
  sourceWebsiteUrl: string | null;
  credibilityScore: number;
  reviewCount: number;
  averageRating: number;
  latestReviewDate: string | null;
}

interface ReviewAggregationProps {
  aggregation: {
    overallAverage: number;
    totalReviewCount: number;
    sourceCount: number;
    bySource: ReviewSourceAggregation[];
    unassignedCount: number;
  } | null;
}

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

const sourceTypeIcons: Record<string, string> = {
  magazine: '📰',
  youtube: '🎥',
  blog: '📝',
  expert: '🏆',
  forum: '💬',
};

export default function ReviewAggregation({ aggregation }: ReviewAggregationProps) {
  if (!aggregation || aggregation.sourceCount === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        Expert Review Aggregation
      </h3>

      {/* Overall score */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{aggregation.overallAverage.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">Weighted Score</div>
        </div>
        <div className="flex-1">
          <StarRating rating={aggregation.overallAverage} />
          <p className="text-sm text-gray-500 mt-1">
            Based on {aggregation.totalReviewCount} reviews from {aggregation.sourceCount} {aggregation.sourceCount === 1 ? 'source' : 'sources'}
          </p>
        </div>
      </div>

      {/* Source breakdown */}
      <div className="space-y-3">
        {aggregation.bySource.map((source) => (
          <div key={source.sourceId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            {source.sourceLogoUrl ? (
              <img src={source.sourceLogoUrl} alt={source.sourceName} className="w-8 h-8 rounded object-contain" />
            ) : (
              <span className="text-xl w-8 text-center">{sourceTypeIcons[source.sourceType] || '📋'}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">{source.sourceName}</span>
                {source.sourceWebsiteUrl && (
                  <a
                    href={source.sourceWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-500 shrink-0"
                    aria-label={`Visit ${source.sourceName}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRating rating={source.averageRating} />
                <span className="text-xs text-gray-400">({source.reviewCount})</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-lg font-bold text-gray-900">{source.averageRating.toFixed(1)}</div>
              <div className="text-xs text-gray-400">cred: {source.credibilityScore}</div>
            </div>
          </div>
        ))}
      </div>

      {aggregation.unassignedCount > 0 && (
        <p className="text-xs text-gray-400 mt-3 italic">
          + {aggregation.unassignedCount} review{aggregation.unassignedCount > 1 ? 's' : ''} from unassigned sources
        </p>
      )}
    </div>
  );
}
