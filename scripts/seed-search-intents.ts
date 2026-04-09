/**
 * Seed script for search intents
 *
 * Creates initial search intent pages based on common user queries.
 */

import { pool } from "../lib/db";

async function seed() {
  console.log("Seeding search intents...");

  const intents = [
    {
      slug: "best-family-cruiser",
      title: "Best Family Cruiser Sailboats",
      metaDescription:
        "Find the best family cruiser sailboats with spacious cabins, safe cockpits, and child-friendly features. Compare top models for family sailing.",
      intro:
        "Family cruising demands a boat that balances safety, comfort, and ease of handling. The best family cruisers offer deep, secure cockpits, generous accommodation for parents and kids, and forgiving sailing characteristics that let everyone enjoy time on the water. These models have proven popular with sailing families.",
      icon: "👨‍👩‍👧‍👦",
      filters: {
        cabinsMin: 2,
        lengthMin: 10,
      },
      maxResults: 12,
      category: "Family Cruisers",
      isPublished: true,
      searchQuery: "family cruiser",
    },
    {
      slug: "shoal-draft-sailboats",
      title: "Shoal Draft Sailboats for Coastal Cruising",
      metaDescription:
        "Discover sailboats with shallow draft for gunkholing and coastal cruising. Compare shallow keel designs from popular manufacturers.",
      intro:
        "Shoal draft sailboats open up cruising grounds that deeper vessels can't reach — shallow bays, protected creeks, and waterside anchorages. The best shallow-draft cruisers combine minimal draft with good upwind performance and stability, making them ideal for coastal exploration and gunkholing.",
      icon: "⚓",
      filters: {
        draftMax: 1.5,
        lengthMin: 9,
      },
      maxResults: 12,
      category: "Shoal Draft",
      isPublished: true,
      searchQuery: "shoal draft",
    },
    {
      slug: "sailboats-with-3-cabins",
      title: "Sailboats with 3 Cabins for Extended Cruising",
      metaDescription:
        "Find sailboats with 3-cabin layouts for extended cruising and liveaboard life. Compare accommodation and storage across popular models.",
      intro:
        "A 3-cabin layout provides the privacy and flexibility needed for extended cruising or liveaboard life. Whether you're sailing with children, hosting guests regularly, or simply value the extra space for gear storage, these 3-cabin sailboats offer practical solutions for longer passages.",
      icon: "🛏️",
      filters: {
        cabinsMin: 3,
        lengthMin: 10,
      },
      maxResults: 12,
      category: "3 Cabin Sailboats",
      isPublished: true,
      searchQuery: "sailboats with 3 cabins",
    },
    {
      slug: "bluewater-sailboats-under-45-feet",
      title: "Bluewater Sailboats Under 45 Feet",
      metaDescription:
        "Find ocean-ready bluewater sailboats under 45 feet. Compare proven offshore cruisers with strong construction and sea-kindly designs.",
      intro:
        "Bluewater capability isn't about size — it's about construction quality, stability, and proven seaworthiness. These sailboats under 45 feet have earned reputations for safe offshore passages, combining moderate displacement with strong hulls and reliable rigs. They're ideal for solo sailors or couples looking to cross oceans.",
      icon: "🌊",
      filters: {
        lengthMin: 10,
        lengthMax: 13.7,
        displacementMin: 4000,
      },
      maxResults: 12,
      category: "Bluewater",
      isPublished: true,
      searchQuery: "bluewater sailboats under 45 feet",
    },
    {
      slug: "cruising-sailboats-under-40-feet",
      title: "Cruising Sailboats Under 40 Feet",
      metaDescription:
        "Find the best cruising sailboats under 40 feet. Compare comfortable cruisers with good storage, tankage, and liveaboard capability.",
      intro:
        "The under-40-foot range offers an ideal balance between manageable size and comfortable living. These cruising sailboats provide sufficient accommodation for couples, adequate tankage for extended voyages, and handling characteristics that make them accessible to solo sailors or couples. They're perfect for weekend cruising and coastal adventures.",
      icon: "⛵",
      filters: {
        lengthMin: 9,
        lengthMax: 12.2,
      },
      maxResults: 12,
      category: "Cruising Sailboats",
      isPublished: true,
      searchQuery: "cruising sailboats under 40 feet",
    },
    {
      slug: "liveaboard-sailboats-good-storage",
      title: "Liveaboard Sailboats with Good Storage",
      metaDescription:
        "Find liveaboard sailboats with excellent storage capacity for extended living aboard. Compare lockers, tankage, and practical features.",
      intro:
        "Living aboard demands more than just a berth — you need clever, abundant storage for everything from food to tools to spare parts. The best liveaboard sailboats feature deep lockers, dedicated storage compartments, and thoughtful design that makes life onboard practical and organized. These models excel at providing the storage space serious liveaboards need.",
      icon: "🏠",
      filters: {
        lengthMin: 11,
        displacementMin: 5000,
      },
      maxResults: 12,
      category: "Liveaboard",
      isPublished: true,
      searchQuery: "liveaboard sailboats good storage",
    },
    {
      slug: "sloop-rigged-sailboats",
      title: "Sloop Rigged Sailboats for Easy Handling",
      metaDescription:
        "Find sloop rigged sailboats with single-mast simplicity and efficient sailing performance. Compare popular sloop designs.",
      intro:
        "The sloop rig's simplicity — a single mast with two sails — makes it the most popular configuration for modern cruising sailors. Fewer sails means less handling on deck, while modern hull designs provide excellent performance. These sloop-rigged sailboats offer the right balance of sailing efficiency and ease of handling for shorthanded crews.",
      icon: "⛵",
      filters: {
        rigType: "Sloop",
        lengthMin: 9,
      },
      maxResults: 12,
      category: "Sloop Rig",
      isPublished: true,
      searchQuery: "sloop rigged sailboats",
    },
    {
      slug: "fin-keel-cruisers",
      title: "Fin Keel Cruising Sailboats",
      metaDescription:
        "Find fin keel cruising sailboats with good upwind performance and maneuverability. Compare fin keel designs for coastal and offshore sailing.",
      intro:
        "Fin keels offer excellent upwind performance, responsive handling, and good maneuverability in tight spaces. Modern fin keel cruisers combine these sailing advantages with comfortable accommodations and proven seaworthiness. These boats are ideal for sailors who value performance and handling ease.",
      icon: "⚓",
      filters: {
        keelType: "Fin keel",
        lengthMin: 9,
      },
      maxResults: 12,
      category: "Fin Keel",
      isPublished: true,
      searchQuery: "fin keel cruisers",
    },
    {
      slug: "fiberglass-sailboats",
      title: "Fiberglass Sailboats for Low Maintenance",
      metaDescription:
        "Find fiberglass sailboats with durable, low-maintenance construction. Compare popular fiberglass models for reliable cruising.",
      intro:
        "Fiberglass construction revolutionized sailing with its durability, low maintenance requirements, and consistent quality. Modern fiberglass sailboats offer decades of reliable service with minimal upkeep, making them ideal choices for sailors who want to spend more time sailing and less time maintaining. These models represent the best in fiberglass construction.",
      icon: "🚢",
      filters: {
        hullMaterial: "Fiberglass",
        lengthMin: 9,
      },
      maxResults: 12,
      category: "Fiberglass",
      isPublished: true,
      searchQuery: "fiberglass sailboats",
    },
    {
      slug: "mid-size-cruisers-35-40-feet",
      title: "Mid-Size Cruising Sailboats (35-40 Feet)",
      metaDescription:
        "Find the best mid-size cruising sailboats between 35 and 40 feet. Compare features, accommodations, and performance.",
      intro:
        "The 35-40 foot range represents the sweet spot for many cruisers — large enough for comfortable living and extended passages, yet manageable enough for a couple to handle. These mid-size cruisers offer the right balance of accommodation, storage, tankage, and sailing performance.",
      icon: "⛵",
      filters: {
        lengthMin: 10.7,
        lengthMax: 12.2,
      },
      maxResults: 12,
      category: "Mid-Size Cruisers",
      isPublished: true,
      searchQuery: "mid-size cruisers 35-40 feet",
    },
  ];

  let created = 0;
  for (const intent of intents) {
    try {
      await pool.query(
        `INSERT INTO search_intents
         (slug, title, meta_description, intro, icon, filters, max_results, category, is_published, search_query)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           meta_description = EXCLUDED.meta_description,
           intro = EXCLUDED.intro,
           icon = EXCLUDED.icon,
           filters = EXCLUDED.filters,
           max_results = EXCLUDED.max_results,
           category = EXCLUDED.category,
           is_published = EXCLUDED.is_published,
           search_query = EXCLUDED.search_query,
           updated_at = NOW()`,
        [
          intent.slug,
          intent.title,
          intent.metaDescription,
          intent.intro,
          intent.icon,
          JSON.stringify(intent.filters),
          intent.maxResults,
          intent.category,
          intent.isPublished,
          intent.searchQuery,
        ]
      );
      created++;
      console.log(`✓ ${intent.slug}`);
    } catch (error) {
      console.error(`✗ ${intent.slug}:`, error);
    }
  }

  console.log(`\nSeeded ${created} search intents.`);
  await pool.end();
}

seed().catch(console.error);
