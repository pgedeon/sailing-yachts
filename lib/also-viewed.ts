/**
 * P21.4 — "Users Also Viewed" Recommendation Engine
 *
 * Uses co-view patterns from page views to recommend yachts that
 * other users with similar interests have also looked at.
 *
 * For yachts with no co-view data yet, falls back to same-size
 * yachts from the same or similar manufacturers.
 */

export interface AlsoViewedYacht {
  id: number;
  manufacturer: string;
  modelName: string;
  slug: string;
  year: number;
  lengthOverall: number | null;
  primaryImage: string | null;
  viewCount: number;
}

/**
 * Build a fallback "also viewed" list based on yacht specs.
 * Used when there's not enough view data for collaborative filtering.
 */
export function buildFallbackAlsoViewed(
  yachts: Array<{
    id: number;
    manufacturer: string;
    modelName: string;
    slug: string;
    year: number;
    lengthOverall: number | string | null;
    manufacturerId: number | null;
    primaryImage: string | null;
  }>,
  currentYacht: {
    id: number;
    lengthOverall: number | string | null;
    manufacturerId: number | null;
    manufacturer: string;
  },
  limit: number = 6,
): AlsoViewedYacht[] {
  const loa = Number(currentYacht.lengthOverall) || 0;

  const scored = yachts
    .filter((y) => y.id !== currentYacht.id)
    .map((y) => {
      let score = 0;
      const yLoa = Number(y.lengthOverall) || 0;

      // Same manufacturer bonus
      if (y.manufacturerId && y.manufacturerId === currentYacht.manufacturerId) {
        score += 30;
      }

      // Size proximity bonus (within ±2m)
      if (loa > 0 && yLoa > 0) {
        const diff = Math.abs(loa - yLoa);
        if (diff <= 0.5) score += 40;
        else if (diff <= 1.0) score += 30;
        else if (diff <= 2.0) score += 20;
        else if (diff <= 3.0) score += 10;
      }

      // Different manufacturer diversity bonus (avoid showing only same brand)
      if (y.manufacturer !== currentYacht.manufacturer) {
        score += 5;
      }

      // Prefer yachts with images
      if (y.primaryImage) score += 5;

      return {
        id: y.id,
        manufacturer: y.manufacturer,
        modelName: y.modelName,
        slug: y.slug,
        year: y.year,
        lengthOverall: yLoa,
        primaryImage: y.primaryImage,
        viewCount: score, // reuse field for score
      };
    })
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);

  return scored;
}
