/**
 * Price Tier Indicator
 *
 * Derives a qualitative price range from yacht specifications.
 * Since actual pricing data is rarely publicly available for sailboats,
 * we estimate based on key spec characteristics.
 *
 * Tiers:
 *   Budget     — Small production yachts, typically under $50k
 *   Mid-Range  — Standard 30-38ft production cruisers, ~$50k–$150k
 *   Premium    — Larger or well-equipped cruisers 38-50ft, ~$150k–$500k
 *   Luxury     — 50ft+ high-end yachts, ~$500k+
 *   Unknown    — Insufficient data to determine
 */

export type PriceTier = "budget" | "mid-range" | "premium" | "luxury" | "unknown";

export interface PriceTierInfo {
  tier: PriceTier;
  label: string;
  range: string;
  color: string;
  bgColor: string;
  confidence: "high" | "medium" | "low";
  reasons: string[];
}

interface YachtSpecs {
  lengthOverall: number | null;
  displacement: number | null;
  beam: number | null;
  cabins: number | null;
  hullMaterial: string | null;
  keelType: string | null;
  rigType: string | null;
}

const TIER_CONFIG: Record<PriceTier, { label: string; range: string; color: string; bgColor: string }> = {
  "budget":    { label: "Budget",      range: "Under $50k",       color: "text-green-700",  bgColor: "bg-green-100" },
  "mid-range": { label: "Mid-Range",   range: "$50k – $150k",     color: "text-blue-700",   bgColor: "bg-blue-100" },
  "premium":   { label: "Premium",     range: "$150k – $500k",    color: "text-purple-700", bgColor: "bg-purple-100" },
  "luxury":    { label: "Luxury",      range: "$500k+",           color: "text-amber-700",  bgColor: "bg-amber-100" },
  "unknown":   { label: "Unknown",     range: "—",                color: "text-gray-500",   bgColor: "bg-gray-100" },
};

/**
 * Calculate price tier based on yacht specifications.
 * Uses a weighted scoring system primarily driven by length overall (LOA),
 * with adjustments for displacement, hull material, cabins, and keel type.
 */
export function calculatePriceTier(specs: YachtSpecs): PriceTierInfo {
  const { lengthOverall, displacement, beam, cabins, hullMaterial, keelType, rigType } = specs;
  // Coerce string values from API to numbers (DB returns decimal columns as strings)
  const loa = typeof lengthOverall === 'string' ? parseFloat(lengthOverall) : lengthOverall;
  const disp = typeof displacement === 'string' ? parseFloat(displacement as any) : displacement;
  const b = typeof beam === 'string' ? parseFloat(beam as any) : beam;
  const cab = typeof cabins === 'string' ? parseInt(cabins as any, 10) : cabins;

  const reasons: string[] = [];

  // Need at least LOA to make any determination
  if (!loa) {
    return {
      tier: "unknown",
      ...TIER_CONFIG["unknown"],
      confidence: "low",
      reasons: ["Insufficient data to estimate price range"],
    };
  }
  let tier: PriceTier;
  let confidence: "high" | "medium" | "low" = "high";

  // Primary: LOA-based tier
  if (loa < 8) {
    tier = "budget";
    reasons.push(`Small yacht at ${loa.toFixed(1)}m LOA`);
  } else if (loa < 9.5) {
    tier = "budget";
    reasons.push(`Compact cruiser at ${loa.toFixed(1)}m LOA`);
  } else if (loa < 11.5) {
    tier = "mid-range";
    reasons.push(`Mid-size cruiser at ${loa.toFixed(1)}m LOA`);
  } else if (loa < 15) {
    tier = "premium";
    reasons.push(`Large cruiser at ${loa.toFixed(1)}m LOA`);
  } else {
    tier = "luxury";
    reasons.push(`Large yacht at ${loa.toFixed(1)}m LOA`);
  }

  // Adjustments based on displacement (heavier = more expensive per foot)
  if (disp && loa) {
    const dispPerMeter = disp / loa;
    if (dispPerMeter > 4000 && tier === "mid-range") {
      tier = "premium";
      reasons.push("Heavy displacement suggests higher build quality");
      confidence = "medium";
    } else if (dispPerMeter > 6000 && tier === "premium") {
      tier = "luxury";
      reasons.push("Very heavy displacement for length");
      confidence = "medium";
    } else if (disp) {
      reasons.push(`Displacement: ${(disp / 1000).toFixed(1)}t`);
    }
  }

  // Hull material premium
  if (hullMaterial) {
    const mat = hullMaterial.toLowerCase();
    if (mat.includes("carbon") || mat.includes("kevlar")) {
      if (tier === "budget" || tier === "mid-range") {
        tier = "premium";
      }
      reasons.push("High-performance hull material");
      confidence = "medium";
    } else if (mat.includes("aluminum") || mat.includes("aluminium") || mat.includes("steel")) {
      if (tier === "mid-range") {
        tier = "premium";
      }
      reasons.push("Metal hull construction");
      confidence = "medium";
    } else if (mat.includes("wood") || mat.includes("classic")) {
      reasons.push("Traditional construction");
    }
  }

  // Cabins premium
  if (cabins && cabins >= 4 && loa < 14) {
    if (tier === "mid-range") {
      tier = "premium";
      reasons.push("High cabin count for length");
      confidence = "medium";
    }
  }

  // Keel type premium
  if (keelType) {
    const kt = keelType.toLowerCase();
    if (kt.includes("lifting") || kt.includes("retractable") || kt.includes("canting")) {
      reasons.push("Performance keel configuration");
      if (tier === "mid-range") {
        tier = "premium";
        confidence = "medium";
      }
    }
  }

  // If we only have LOA and no other confirming data, reduce confidence
  if (!disp && !hullMaterial && !cabins) {
    confidence = "low";
  }

  const config = TIER_CONFIG[tier];

  return {
    tier,
    label: config.label,
    range: config.range,
    color: config.color,
    bgColor: config.bgColor,
    confidence,
    reasons,
  };
}

/**
 * Get price tier display info from tier string (for when tier is already computed)
 */
export function getPriceTierDisplay(tier: PriceTier): { label: string; range: string; color: string; bgColor: string } {
  return TIER_CONFIG[tier];
}
