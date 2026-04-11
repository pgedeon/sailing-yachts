/**
 * Glossary Terms Service
 *
 * Manages sailing terminology and spec-related terms with auto-linking support.
 * Provides static term definitions for yachts, guides, and SEO landing pages.
 */

export interface GlossaryTerm {
  term: string;
  slug: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
  relatedYachts?: string[]; // yacht slugs to suggest as examples
  aliases?: string[]; // alternative spellings or abbreviations
}

// Core sailing and spec-related terms
const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "LOA",
    slug: "loa",
    definition: "Length Overall. The maximum length of a sailing yacht from the forward point of the bow to the aftermost point of the stern, including any bowsprits or stern extensions. This is the most commonly cited length specification and is used for registration, marina fees, and many regulations.",
    category: "Dimensions",
    relatedTerms: ["Length Overall", "Length at Waterline (LWL)", "Waterline Length"],
    aliases: ["Length Overall", "overall length"],
  },
  {
    term: "Beam",
    slug: "beam",
    definition: "The maximum width of a sailing yacht measured at its widest point. A wider beam generally provides more interior space and initial stability but can reduce performance in rough seas and increase windage. Modern cruising yachts often have beams around 35-45% of their LOA.",
    category: "Dimensions",
    relatedTerms: ["LOA", "Draft", "Displacement"],
    aliases: ["width", "maximum width"],
  },
  {
    term: "Draft",
    slug: "draft",
    definition: "The vertical distance from the waterline to the lowest point of the keel, also known as the yacht's keel depth. Shoal draft yachts (under 1.5m) can access shallow coastal waters and anchorages but may sacrifice upwind performance and stability compared to deeper draft designs.",
    category: "Dimensions",
    relatedTerms: ["Keel Type", "Shoal Draft", "Keel Depth"],
    aliases: ["keel depth", "draught"],
  },
  {
    term: "Displacement",
    slug: "displacement",
    definition: "The weight of the water displaced by a sailing yacht, which equals the yacht's total weight. Measured in tonnes or kilograms. Heavier displacement (diesel, steel, or heavily built) provides more comfort in rough seas and storage capacity but reduces acceleration and top speed compared to lighter displacement designs.",
    category: "Technical",
    relatedTerms: ["Ballast Ratio", "Hull Speed", "Ballast"],
    aliases: ["displacement weight", "boat weight"],
  },
  {
    term: "Ballast",
    slug: "ballast",
    definition: "Weight placed low in a sailing yacht, typically in the keel, to provide stability and prevent capsizing. Modern yachts use lead or iron ballast, often shaped as a fin bulb or in a winged configuration. The ballast ratio (ballast ÷ displacement) is a key indicator of a yacht's stiffness and safety.",
    category: "Technical",
    relatedTerms: ["Ballast Ratio", "Keel Type", "Fin Keel"],
    aliases: ["keel weight", "stability weight"],
  },
  {
    term: "Ballast Ratio",
    slug: "ballast-ratio",
    definition: "The ratio of a yacht's ballast weight to its total displacement, expressed as a percentage. A typical cruising yacht has a ballast ratio of 30-45%, while performance-oriented designs may exceed 50%. Higher ballast ratios generally indicate a stiffer, more stable boat, though hull form and center of gravity also matter significantly.",
    category: "Technical",
    relatedTerms: ["Ballast", "Displacement", "Stability"],
    aliases: ["ballast/displacement ratio", "stability ratio"],
  },
  {
    term: "Fin Keel",
    slug: "fin-keel",
    definition: "A type of keel that extends vertically downward from the hull with a relatively thin profile. Fin keels offer excellent upwind performance, reduced wetted surface, and better maneuverability compared to full keels or long keels. Most modern production yachts use fin keels, often with a bulb at the tip to lower the center of gravity.",
    category: "Hull & Keel",
    relatedTerms: ["Keel Type", "Bulb Keel", "Draft"],
    aliases: ["fin", "vertical keel"],
  },
  {
    term: "Wing Keel",
    slug: "wing-keel",
    definition: "A fin keel with horizontal wings or plates at the bottom, designed to reduce draft while maintaining ballast weight and stability. Wing keels are popular in cruising yachts for shallow-water access, though they may have slightly reduced upwind performance compared to a deeper fin keel of similar stability.",
    category: "Hull & Keel",
    relatedTerms: ["Keel Type", "Fin Keel", "Shoal Draft"],
    aliases: ["winged keel", "wing"],
  },
  {
    term: "Cutter Rig",
    slug: "cutter-rig",
    definition: "A sail plan configuration with two or more headsails set forward of the mast. A true cutter has the inner forestay (for the staysail) set at approximately 7-10% of LOA aft of the bow. Cutter rigs offer versatile sail combinations for different conditions and easier reefing, making them popular for bluewater cruisers.",
    category: "Rig & Sails",
    relatedTerms: ["Rig Type", "Sloop Rig", "Headsail"],
    aliases: ["cutter", "double headsail"],
  },
  {
    term: "Sloop Rig",
    slug: "sloop-rig",
    definition: "The most common modern sail plan, featuring a single mast and two sails: a mainsail and a headsail (genoa or jib). Sloop rigs are simple, efficient, and easy to handle, making them ideal for most cruising and racing applications. Most production yachts under 50 feet use sloop rigs.",
    category: "Rig & Sails",
    relatedTerms: ["Rig Type", "Cutter Rig", "Mainsail"],
    aliases: ["sloop", "single mast"],
  },
  {
    term: "Ketch Rig",
    slug: "ketch-rig",
    definition: "A two-masted sail plan with the main mast forward and a shorter mizzen mast aft. Ketches offer smaller, more manageable sails and the ability to balance the boat under mizzen and headsail alone. Historically popular for long-distance cruising, though less common in modern production due to added complexity and weight.",
    category: "Rig & Sails",
    relatedTerms: ["Rig Type", "Sloop Rig", "Yawl Rig"],
    aliases: ["ketch", "two-mast"],
  },
  {
    term: "Shoal Draft",
    slug: "shoal-draft",
    definition: "A shallow keel depth, typically under 1.5 meters (5 feet). Shoal draft yachts can access shallow anchorages, coastal waters, and inland waterways that deeper vessels cannot. This design trades some upwind performance and initial stability for the versatility of exploring shallow waters.",
    category: "Hull & Keel",
    relatedTerms: ["Draft", "Keel Type", "Wing Keel"],
    aliases: ["shallow draft", "shallow keel"],
  },
  {
    term: "Waterline Length (LWL)",
    slug: "lwl",
    definition: "Length at Waterline. The length of a sailing yacht measured at the water surface when at its designed displacement. LWL is a more accurate predictor of hull speed and performance potential than LOA, as it reflects the portion of the hull actually in contact with water.",
    category: "Dimensions",
    relatedTerms: ["LOA", "Hull Speed", "Displacement"],
    aliases: ["Length at Waterline", "waterline length"],
  },
  {
    term: "Hull Speed",
    slug: "hull-speed",
    definition: "The theoretical maximum speed of a displacement hull sailing yacht, calculated as approximately 1.34 × √LWL (where LWL is in feet, speed in knots). Beyond this speed, wave drag increases dramatically. Light displacement, planing, or semi-planing hulls can exceed traditional hull speed limitations.",
    category: "Performance",
    relatedTerms: ["LWL", "Displacement", "Planing Hull"],
    aliases: ["displacement speed", "theoretical speed"],
  },
  {
    term: "Cabin",
    slug: "cabin",
    definition: "An enclosed interior space on a sailing yacht, typically used for sleeping or living. The number of cabins is a key accommodation specification, ranging from 1-2 in smaller coastal cruisers to 4-6 in larger bluewater or charter vessels. Each cabin usually includes berths, storage, and may have an ensuite head.",
    category: "Accommodation",
    relatedTerms: ["Berth", "Head", "Cabins"],
    aliases: ["sleeping cabin", "stateroom"],
  },
  {
    term: "Berth",
    slug: "berth",
    definition: "A sleeping place or bed on a sailing yacht. Can be a fixed bunk, a convertible settee, or a quarter berth in the saloon. The total berths specification indicates maximum sleeping capacity, though real-world comfort is typically lower than the advertised number.",
    category: "Accommodation",
    relatedTerms: ["Cabin", "Max Occupancy", "Saloon"],
    aliases: ["bunk", "sleeping place"],
  },
  {
    term: "Head",
    slug: "head",
    definition: "The marine term for a toilet or bathroom on a sailing yacht. Modern cruising yachts often have multiple heads, sometimes with separate showers. The number of heads is an important accommodation factor for extended cruising and liveaboard use.",
    category: "Accommodation",
    relatedTerms: ["Cabin", "Berth", "Water Capacity"],
    aliases: ["toilet", "bathroom", "marine toilet"],
  },
  {
    term: "Bluewater",
    slug: "bluewater",
    definition: "A term for offshore or ocean-capable sailing yachts designed for extended voyages across open seas. Bluewater yachts typically feature heavier displacement, robust construction, ample tankage, conservative sail plans, and safety systems for self-sufficiency far from shore support.",
    category: "Sailing Types",
    relatedTerms: ["Coastal Cruiser", "Offshore", "Ocean Cruiser"],
    aliases: ["blue water", "offshore", "ocean cruiser"],
  },
  {
    term: "Coastal Cruiser",
    slug: "coastal-cruiser",
    definition: "A sailing yacht designed primarily for coastal and inland water sailing, typically within sight of land or with easy access to shelter. Coastal cruisers often prioritize comfort, ease of handling, and light-air performance over the heavy build and robust systems of bluewater designs.",
    category: "Sailing Types",
    relatedTerms: ["Bluewater", "Day Sailor", "Pocket Cruiser"],
    aliases: ["coastal", "day cruiser"],
  },
  {
    term: "Liveaboard",
    slug: "liveaboard",
    definition: "A sailing yacht designed or adapted for full-time residential living. Liveaboard boats prioritize interior volume, storage, tankage capacity, heating/cooling systems, and domestic amenities over sailing performance. Many bluewater cruisers serve as dual-purpose liveaboard vessels.",
    category: "Sailing Types",
    relatedTerms: ["Bluewater", "Cabin", "Water Capacity"],
    aliases: ["live aboard", "residential"],
  },
];

// Build lookup maps for efficient searching
const TERM_MAP = new Map<string, GlossaryTerm>();
const SLUG_MAP = new Map<string, GlossaryTerm>();
const ALIAS_MAP = new Map<string, GlossaryTerm>();

for (const term of GLOSSARY_TERMS) {
  TERM_MAP.set(term.term.toLowerCase(), term);
  SLUG_MAP.set(term.slug, term);

  // Map aliases to terms
  if (term.aliases) {
    for (const alias of term.aliases) {
      ALIAS_MAP.set(alias.toLowerCase(), term);
    }
  }
}

/**
 * Get all glossary terms, optionally filtered by category
 */
export function getAllGlossaryTerms(category?: string): GlossaryTerm[] {
  if (!category) {
    return [...GLOSSARY_TERMS].sort((a, b) => a.term.localeCompare(b.term));
  }
  return GLOSSARY_TERMS.filter((t) => t.category === category).sort((a, b) =>
    a.term.localeCompare(b.term),
  );
}

/**
 * Get all unique categories
 */
export function getGlossaryCategories(): string[] {
  const categories = new Set(GLOSSARY_TERMS.map((t) => t.category));
  return Array.from(categories).sort();
}

/**
 * Get a term by its slug
 */
export function getTermBySlug(slug: string): GlossaryTerm | undefined {
  return SLUG_MAP.get(slug);
}

/**
 * Find a term by text (exact match or alias)
 */
export function findTerm(text: string): GlossaryTerm | undefined {
  const lower = text.toLowerCase();
  return TERM_MAP.get(lower) || ALIAS_MAP.get(lower);
}

/**
 * Get terms that match a search query (fuzzy search)
 */
export function searchGlossaryTerms(query: string): GlossaryTerm[] {
  const lower = query.toLowerCase();
  return GLOSSARY_TERMS.filter(
    (t) =>
      t.term.toLowerCase().includes(lower) ||
      t.definition.toLowerCase().includes(lower) ||
      t.category.toLowerCase().includes(lower) ||
      t.aliases?.some((a) => a.toLowerCase().includes(lower)),
  );
}

/**
 * Auto-link glossary terms in text content
 * Returns HTML with glossary links inserted
 */
export function autoLinkGlossaryTerms(
  text: string,
  options?: {
    maxLinks?: number;
    excludeTerms?: string[]; // term slugs to exclude
  },
): string {
  const maxLinks = options?.maxLinks ?? 10;
  const excludeSet = new Set(options?.excludeTerms ?? []);

  let linkedCount = 0;
  let result = text;

  // Sort terms by length (longest first) to match "LOA" before "L"
  const sortedTerms = [...GLOSSARY_TERMS]
    .filter((t) => !excludeSet.has(t.slug))
    .sort((a, b) => b.term.length - a.term.length);

  for (const term of sortedTerms) {
    if (linkedCount >= maxLinks) break;

    const escaped = term.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

    const matches = result.match(regex);
    if (!matches) continue;

    result = result.replace(regex, (match, offset) => {
      // Only link the first occurrence to avoid over-linking
      if (linkedCount >= maxLinks) return match;

      linkedCount++;
      return `<a href="/glossary/${term.slug}" class="glossary-link" title="${term.term}: ${term.definition.substring(0, 80)}...">${match}</a>`;
    });
  }

  return result;
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(term: GlossaryTerm): GlossaryTerm[] {
  const related: GlossaryTerm[] = [];

  if (term.relatedTerms) {
    for (const relatedName of term.relatedTerms) {
      const found = findTerm(relatedName);
      if (found && found.slug !== term.slug) {
        related.push(found);
      }
    }
  }

  // Also find terms in the same category
  const sameCategory = GLOSSARY_TERMS.filter(
    (t) => t.category === term.category && t.slug !== term.slug,
  );
  related.push(...sameCategory.slice(0, 3));

  // Remove duplicates and limit
  const unique = Array.from(new Map(related.map((t) => [t.slug, t])).values());
  return unique.slice(0, 5);
}
