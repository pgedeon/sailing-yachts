/**
 * Landing Page Definitions
 *
 * Each landing page targets a specific high-intent search query.
 * Pages are generated at build time via generateStaticParams with ISR.
 *
 * Rules:
 * - slug must be URL-safe (lowercase, hyphens only)
 * - filters use DB column names mapped to API filter params
 * - intro copy should be unique per page (no duplicate content)
 * - maxResults caps how many yacht cards to show
 */

export interface LandingPageDefinition {
  /** URL-safe slug used in /best/[slug] */
  slug: string;
  /** H1 and page title — e.g. "Best 40-Foot Cruising Sailboats" */
  title: string;
  /** Meta description (150-160 chars) */
  metaDescription: string;
  /** Unique introductory paragraph (2-4 sentences) */
  intro: string;
  /** Emoji for card display */
  icon: string;
  /** Filters to apply when querying matching yachts */
  filters: {
    lengthMin?: number;   // meters
    lengthMax?: number;   // meters
    cabinsMin?: number;
    keelType?: string;
    rigType?: string;
    hullMaterial?: string;
    displacementMin?: number; // kg
  };
  /** Maximum yacht cards to show */
  maxResults: number;
  /** Canonical category for internal linking and breadcrumbs */
  category: string;
  /** Related landing page slugs for cross-linking */
  related?: string[];
}

export const LANDING_PAGES: LandingPageDefinition[] = [
  {
    slug: "40-foot-cruising-sailboats",
    title: "Best 40-Foot Cruising Sailboats",
    metaDescription:
      "Explore the best 40-foot cruising sailboats with detailed specs, dimensions, and comparisons. Find your ideal mid-size cruiser from top manufacturers.",
    intro:
      "The 40-foot range represents a sweet spot for cruising sailboats — large enough for comfortable liveaboard life and offshore passages, yet manageable enough for a couple to handle. These yachts typically offer 2-3 cabins, generous tankage, and proven offshore capability. Below are the top models from our database.",
    icon: "⛵",
    filters: {
      lengthMin: 11.5,
      lengthMax: 12.8,
    },
    maxResults: 12,
    category: "Cruising Sailboats",
    related: ["bluewater-sailboats-under-45-feet", "family-cruisers-3-cabins"],
  },
  {
    slug: "bluewater-sailboats-under-45-feet",
    title: "Best Bluewater Sailboats Under 45 Feet",
    metaDescription:
      "Discover ocean-ready bluewater sailboats under 45 feet. Compare specs, displacement, and keel types for safe offshore cruising from trusted builders.",
    intro:
      "Bluewater capability isn't just about size — it's about construction quality, stability, and seakindly behavior. The best bluewater sailboats under 45 feet combine moderate displacement with proven fin or full keel designs, offering the right balance of performance and safety for ocean crossings.",
    icon: "🌊",
    filters: {
      lengthMin: 10.5,
      lengthMax: 13.7,
      keelType: "Fin keel",
    },
    maxResults: 12,
    category: "Bluewater",
    related: ["40-foot-cruising-sailboats", "performance-cruisers-under-35-feet"],
  },
  {
    slug: "liveaboard-sailboats-with-3-cabins",
    title: "Best Liveaboard Sailboats with 3 Cabins",
    metaDescription:
      "Find the best liveaboard sailboats with 3 cabins for family cruising. Compare accommodation, tankage, and living space across top models.",
    intro:
      "A 3-cabin layout transforms a sailboat into a genuine floating home. Whether you're planning extended cruising with kids, hosting guests aboard, or simply value the flexibility of separate sleeping quarters, these models deliver the space and comfort that make full-time living aboard practical.",
    icon: "🏠",
    filters: {
      cabinsMin: 3,
      lengthMin: 10,
    },
    maxResults: 12,
    category: "Liveaboard",
    related: ["family-cruisers-3-cabins", "40-foot-cruising-sailboats"],
  },
  {
    slug: "performance-cruisers-under-35-feet",
    title: "Best Performance Cruisers Under 35 Feet",
    metaDescription:
      "Compare the best performance cruising sailboats under 35 feet. Fast, agile yachts with modern rigs and competitive sail plans for racing and cruising.",
    intro:
      "Performance cruisers under 35 feet deliver the thrill of responsive sailing without sacrificing the comforts needed for weekend cruising. These boats feature efficient hull forms, powerful sail plans, and lightweight construction that make them equally at home on the race course and at anchor.",
    icon: "🏆",
    filters: {
      lengthMax: 10.7,
      rigType: "Sloop",
    },
    maxResults: 12,
    category: "Performance",
    related: ["40-foot-cruising-sailboats", "bluewater-sailboats-under-45-feet"],
  },
  {
    slug: "family-cruisers-3-cabins",
    title: "Best Family Cruising Sailboats with 3+ Cabins",
    metaDescription:
      "Top family cruising sailboats with 3 or more cabins for comfortable sailing holidays. Compare specs, accommodation, and safety features.",
    intro:
      "Family cruising demands a boat that's safe, spacious, and easy to handle. The best family sailboats in this range offer 3 or more cabins for privacy, deep cockpits for security, and forgiving sailing characteristics that let parents relax while underway. These are the models families consistently choose.",
    icon: "👨‍👩‍👧‍👦",
    filters: {
      cabinsMin: 3,
      lengthMin: 9,
      lengthMax: 14,
    },
    maxResults: 12,
    category: "Family",
    related: ["liveaboard-sailboats-with-3-cabins", "40-foot-cruising-sailboats"],
  },
];

/**
 * Get a landing page definition by slug
 */
export function getLandingPageBySlug(slug: string): LandingPageDefinition | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}

/**
 * Get all landing page slugs (for generateStaticParams)
 */
export function getAllLandingPageSlugs(): string[] {
  return LANDING_PAGES.map((p) => p.slug);
}
