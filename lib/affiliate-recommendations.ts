/**
 * Affiliate recommendation utility.
 *
 * Provides relevant Amazon affiliate product recommendations for sailing yachts
 * based on yacht characteristics (size, price tier, rig type, keel type, etc.).
 * All links use the shared affiliate tag (pgedeon-20).
 */

import recommendationData from "../data/affiliate-recommendations.json";
import type { PriceTier } from "./price-tier";

export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  amazonCategory: string;
  tags: string[];
  recommendedProducts: string[];
  affiliateUrl: string;
}

export interface AffiliateCategory {
  id: string;
  label: string;
  icon: string;
  products: AffiliateProduct[];
}

interface YachtProfile {
  lengthOverall: number | null;
  displacement: number | null;
  beam: number | null;
  cabins: number | null;
  hullMaterial: string | null;
  keelType: string | null;
  rigType: string | null;
  priceTier?: PriceTier;
}

/**
 * Affiliate tag for the sailing-yachts project. Kept as data-driven constant:
 * used in disclosures and any future direct-URL fallbacks.
 */
const AFFILIATE_TAG = recommendationData.affiliateTag || "pgedeon-20";

/**
 * Generate tracked proxy URL via api.petergedeon.com link service.
 *
 * Every outbound affiliate click flows through a registered slug (SY-{productId})
 * so clicks are counted server-side per slug and A/B variants can be attributed
 * via the ascsubtag the link service appends on redirect.
 */
const PROXY_BASE = "https://api.petergedeon.com/a";

function generateAmazonUrl(category: string, searchTerm: string, productId?: string): string {
  const slug = productId ? `SY-${productId}` : `SY-${category}`;
  return `${PROXY_BASE}/${slug}`;
}

/**
 * Determine relevant product recommendations for a yacht.
 * Scores products based on yacht characteristics and price tier.
 */
function scoreProducts(
  products: Array<{
    id: string;
    name: string;
    description: string;
    priceRange: string;
    amazonCategory: string;
    tags: string[];
    tierRecommendations: Record<string, string[]>;
  }>,
  yacht: YachtProfile
): AffiliateProduct[] {
  const results: AffiliateProduct[] = [];

  for (const product of products) {
    let score = 0;

    // Score based on price tier
    const tier = yacht.priceTier || "unknown";
    if (product.tierRecommendations[tier]) {
      score += 5; // Base score for matching tier
    }

    // Score based on yacht characteristics
    const tags = yacht.hullMaterial?.toLowerCase() || "";
    const keel = yacht.keelType?.toLowerCase() || "";
    const rig = yacht.rigType?.toLowerCase() || "";

    // Hull material matching
    if (tags.includes("wood") && product.tags.includes("maintenance")) {
      score += 2;
    }
    if (tags.includes("carbon") || tags.includes("kevlar")) {
      if (product.tags.includes("rigging") || product.tags.includes("navigation")) {
        score += 2;
      }
    }

    // Keel type matching
    if (keel.includes("lift") || keel.includes("cant")) {
      if (product.tags.includes("safety") || product.tags.includes("navigation")) {
        score += 2;
      }
    }

    // Rig type matching
    if (rig.includes("ketch") || rig.includes("yawl")) {
      if (product.tags.includes("rigging") || product.tags.includes("deck")) {
        score += 2;
      }
    }

    // Size-based recommendations
    const loa = yacht.lengthOverall || 0;
    if (loa > 15) {
      // Large yachts → premium equipment
      if (product.tags.includes("professional") || product.tags.includes("luxury")) {
        score += 3;
      }
    } else if (loa < 10) {
      // Small yachts → basic equipment
      if (product.tags.includes("basic") || product.tags.includes("beginner")) {
        score += 3;
      }
    }

    // Only include products with a reasonable score
    if (score >= 3) {
      const tierRecs = product.tierRecommendations[tier] || product.tierRecommendations["mid-range"] || [];
      const searchTerm = tierRecs[0] || product.name;

      results.push({
        id: product.id,
        name: product.name,
        description: product.description,
        priceRange: product.priceRange,
        amazonCategory: product.amazonCategory,
        tags: product.tags,
        recommendedProducts: tierRecs,
        affiliateUrl: generateAmazonUrl(product.amazonCategory, searchTerm, product.id),
      });
    }
  }

  return results;
}

/**
 * Get relevant affiliate recommendations for a yacht.
 * Returns categories with scored products, limited to max products per category.
 */
export function getAffiliateRecommendations(
  yacht: YachtProfile,
  options?: { maxProductsPerCategory?: number; maxCategories?: number }
): AffiliateCategory[] {
  const maxProducts = options?.maxProductsPerCategory || 3;
  const maxCategories = options?.maxCategories || 4;

  const categories: AffiliateCategory[] = [];

  for (const [categoryId, categoryData] of Object.entries(recommendationData.gearCategories)) {
    const scoredProducts = scoreProducts(categoryData.products as any, yacht);

    if (scoredProducts.length > 0) {
      categories.push({
        id: categoryId,
        label: categoryData.label,
        icon: categoryData.icon,
        products: scoredProducts.slice(0, maxProducts),
      });
    }
  }

  // Sort categories by number of relevant products (most relevant first)
  categories.sort((a, b) => b.products.length - a.products.length);

  return categories.slice(0, maxCategories);
}

/**
 * Get affiliate disclosure text (required by Amazon Associates).
 */
export function getAffiliateDisclosure(): string {
  return "As an Amazon Associate, we earn from qualifying purchases. This helps support the sailing yachts database.";
}
