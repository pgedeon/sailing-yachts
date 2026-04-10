/**
 * Buying Guide Templates
 *
 * Defines reusable buying guide templates for the /guides platform.
 * Supports different guide types with filtered yacht lists and unique intro copy.
 */

export interface BuyingGuideFilter {
  lengthMin?: number;
  lengthMax?: number;
  cabinsMin?: number;
  cabinsMax?: number;
  keelType?: string;
  rigType?: string;
  hullMaterial?: string;
  displacementMin?: number;
  displacementMax?: number;
}

export interface BuyingGuideTemplate {
  id: string;
  type: GuideType;
  title: string;
  description: string;
  intro: string;
  faqs: FAQ[];
  filters: BuyingGuideFilter;
  maxResults?: number;
  icon: string;
}

export type GuideType =
  | "best-sailboats-for"
  | "how-to-choose"
  | "x-vs-y-explained"
  | "new-vs-used"
  | "what-size-cruiser";

export interface FAQ {
  question: string;
  answer: string;
}

/**
 * Pre-defined buying guide templates
 */
export const BUYING_GUIDE_TEMPLATES: BuyingGuideTemplate[] = [
  {
    id: "best-beginner-sailboats",
    type: "best-sailboats-for",
    title: "Best Sailboats for Beginners",
    description:
      "Discover the best beginner-friendly sailboats that are easy to handle, forgiving, and affordable.",
    intro: `Starting your sailing journey is exciting, but choosing the right boat can be overwhelming. The best beginner sailboats share common traits: manageable size, simple rigging, forgiving handling, and reasonable cost of ownership. Below we've curated a selection of yachts that are perfect for new sailors to build confidence and skills.`,
    faqs: [
      {
        question: "What size sailboat is best for beginners?",
        answer:
          "Most beginners start with boats between 20-30 feet (6-9 meters). This size is manageable for single-handed sailing or with a small crew, while still providing enough cabin space for weekend trips. Larger boats can be intimidating to handle, especially when docking or anchoring.",
      },
      {
        question: "Should I buy a new or used beginner sailboat?",
        answer:
          "Used sailboats are often the best choice for beginners. You'll typically get more boat for your money, and any dings or scratches from learning will be less concerning. Plus, many upgrades may already be installed. A 10-20 year old boat in good condition is an excellent starting point.",
      },
      {
        question: "What's a good budget for a first sailboat?",
        answer:
          "Entry-level sailboats can range from $5,000 to $30,000 depending on size, age, and condition. Factor in additional costs for survey, haul-out, insurance, and initial gear. Many experienced sailors recommend spending 70% of your budget on the boat and keeping 30% for immediate upgrades and maintenance.",
      },
      {
        question: "Do I need a license to sail a beginner sailboat?",
        answer:
          "Requirements vary by country and location. In the U.S., there's generally no license required for recreational sailing, though some states require boating safety courses. In Europe, you may need an ICC (International Certificate of Competence) or equivalent. Always check local regulations before setting sail.",
      },
    ],
    filters: {
      lengthMin: 6,
      lengthMax: 9,
      keelType: "Fin keel",
    },
    maxResults: 12,
    icon: "⛵",
  },
  {
    id: "best-family-cruisers",
    type: "best-sailboats-for",
    title: "Best Family Cruising Sailboats",
    description:
      "Comfortable, safe sailboats with multiple cabins for family adventures and longer voyages.",
    intro: `Family sailing is about comfort, safety, and creating lasting memories together. The best family cruisers offer ample living space, multiple sleeping cabins, good sea berths for offshore passages, and safety features like enclosed cockpits and high lifelines. We've selected boats that balance performance with livability for crews of all ages.`,
    faqs: [
      {
        question: "How many cabins do I need for family sailing?",
        answer:
          "For most families, 2-3 cabins work well. A forward V-berth for the parents, an aft cabin for kids or guests, and potentially a third cabin for storage or occasional use. Many families with one or two children find a 2-cabin layout with convertible settees perfectly adequate.",
      },
      {
        question: "What size sailboat is best for a family of four?",
        answer:
          "A 35-45 foot (10-14 meter) sailboat provides enough space for a family of four to cruise comfortably. This size range offers 2-3 cabins, a proper galley, and a head with shower, while still being manageable for two people to handle under sail.",
      },
      {
        question: "Are catamarans or monohulls better for families?",
        answer:
          "Both have advantages. Monohulls are more affordable, better upwind sailors, and have more marina options. Catamarans offer more space, stability, and shallow draft for anchoring close to beaches. Many families appreciate the flat sailing motion and separate hulls for privacy on catamarans.",
      },
      {
        question: "What safety features should I look for in a family cruiser?",
        answer:
          "Key safety features include high lifelines, secure lifeline gates, enclosed or deep cockpit, good handholds throughout, navigation lights, VHF radio, life jackets in all sizes, and reliable engine. For coastal or offshore sailing, add EPIRB, life raft, and jacklines with harnesses.",
      },
    ],
    filters: {
      lengthMin: 10,
      lengthMax: 14,
      cabinsMin: 2,
    },
    maxResults: 12,
    icon: "👨‍👩‍👧‍👦",
  },
  {
    id: "best-bluewater-cruisers",
    type: "best-sailboats-for",
    title: "Best Bluewater Cruising Sailboats",
    description:
      "Ocean-going sailboats built for long-distance passages with proven seaworthiness.",
    intro: `Bluewater cruising requires a boat that can handle whatever the ocean throws at it. The best offshore cruisers combine heavy displacement, robust construction, conservative rigging, and tankage for long passages. These boats may not be the fastest, but they offer the confidence and comfort needed for crossing oceans or living aboard far from shore.`,
    faqs: [
      {
        question: "What makes a sailboat suitable for bluewater cruising?",
        answer:
          "Bluewater cruisers should have heavy displacement for stability in rough seas, robust construction (often solid glass hulls), conservative sail plans, large water and fuel tanks, proper sea berths, and secure storage for provisions. Many experienced cruisers prefer full-keel or modified-fin keel designs for tracking stability.",
      },
      {
        question: "What size is ideal for offshore cruising?",
        answer:
          "Most bluewater cruisers fall in the 40-50 foot range (12-15 meters). This size balances sea-kindliness with manageability. Smaller boats can be offshore-capable but offer less storage and comfort. Larger boats become more expensive to maintain and harder to handle short-handed in heavy conditions.",
      },
      {
        question: "Do I need a steel or aluminum hull for offshore sailing?",
        answer:
          "Not necessarily. Quality fiberglass (GRP) hulls are the standard for modern bluewater boats and offer decades of proven service. Steel provides impact resistance for ice, while aluminum offers weight savings. The construction quality and maintenance history matter more than hull material for most cruising sailors.",
      },
      {
        question: "What's the difference between coastal and bluewater cruisers?",
        answer:
          "Coastal cruisers prioritize speed, amenities, and comfort in fair weather. Bluewater cruisers prioritize seaworthiness, durability, and self-sufficiency for extended passages. Key differences include heavier displacement, stronger rigging, more tankage, sea berths, and redundancy in critical systems.",
      },
    ],
    filters: {
      lengthMin: 12,
      lengthMax: 15,
      displacementMin: 8000,
      keelType: "Fin keel",
    },
    maxResults: 10,
    icon: "🌊",
  },
  {
    id: "best-liveaboard-sailboats",
    type: "best-sailboats-for",
    title: "Best Liveaboard Sailboats",
    description:
      "Spacious sailboats designed for comfortable full-time living aboard, with room for extended stays.",
    intro: `Living aboard a sailboat full-time requires different priorities than weekend sailing or occasional cruising. The best liveaboard boats offer generous interior volume, excellent ventilation, robust systems (water, power, refrigeration), and storage solutions for all your worldly possessions. We've selected boats that balance livability with the ability to actually go sailing when the mood strikes.`,
    faqs: [
      {
        question: "What size sailboat is needed to live aboard?",
        answer:
          "Most liveaboards choose boats 40+ feet (12+ meters) for comfort. While it's possible to live on smaller boats, 40 feet typically provides a separate forward cabin, head with shower, proper galley, and saloon that converts to a berth. Storage space increases significantly with size in liveaboard layouts.",
      },
      {
        question: "What amenities are essential for liveaboard life?",
        answer:
          "Essential amenities include reliable refrigeration (12V or engine-driven), hot water, decent shower, good ventilation (hatches and portlights), shore power hookup, and adequate battery bank with solar/wind charging. Desirable extras include washing machine, air conditioning/heating, and watermaker for extended cruising.",
      },
      {
        question: "How much does it cost to live aboard a sailboat?",
        answer:
          "Liveaboard costs vary widely depending on location and lifestyle. Marina fees range from $200-1000+ per month. Insurance, maintenance, and system upgrades add $200-500 monthly. Many liveaboards work part-time or remotely to cover expenses, and costs drop significantly when anchored out instead of paying marina fees.",
      },
      {
        question: "What's the difference between coastal liveaboard and cruising liveaboard boats?",
        answer:
          "Coastal liveaboards often prioritize luxury, space, and shore power connectivity. Cruising liveaboards need efficient systems, tankage for off-grid living, and seaworthiness for passages. Many liveaboards start with coastal boats then upgrade to cruising-capable vessels when planning to leave the dock.",
      },
    ],
    filters: {
      lengthMin: 12,
      cabinsMin: 2,
    },
    maxResults: 10,
    icon: "🏠",
  },
  {
    id: "how-to-choose-first-sailboat",
    type: "how-to-choose",
    title: "How to Choose Your First Sailboat",
    description:
      "A comprehensive guide to selecting the right sailboat based on your sailing goals, experience, and budget.",
    intro: `Buying your first sailboat is a major decision that balances dreams with practical realities. This guide walks you through the key considerations to help you choose a boat that matches your sailing aspirations, experience level, and budget. Remember: the best first boat is one that gets you on the water sailing, not one that sits at the dock while you save for the perfect boat.`,
    faqs: [
      {
        question: "Should I buy the boat of my dreams as my first boat?",
        answer:
          "Not recommended. Many experienced sailors recommend buying a smaller, simpler first boat to build skills and confirm your passion for sailing. You'll learn what features truly matter to you through experience. After 1-3 years, you can sell and upgrade to a boat that better matches your refined preferences.",
      },
      {
        question: "What's more important: boat age or condition?",
        answer:
          "Condition is far more important than age. A well-maintained 20-year-old boat can be a better buy than a neglected 5-year-old boat. Always get a professional marine survey before purchase. Surveyors can identify issues that aren't obvious to the untrained eye, potentially saving you thousands in repairs.",
      },
      {
        question: "How do I determine my sailing goals before buying?",
        answer:
          "Ask yourself: Will you daysail near home, coastal cruise, or dream of offshore passages? Will you sail solo or with family? What's your realistic time commitment for maintenance? Will you mostly sail in summer or year-round? Honest answers to these questions guide you toward the right boat type and size.",
      },
      {
        question: "What hidden costs should I budget for when buying a first sailboat?",
        answer:
          "Beyond purchase price, budget for: marine survey ($500-2000), haul-out and bottom paint, winter storage (if applicable), insurance ($500-2000/year), annual maintenance (5-10% of boat value), and initial gear upgrades (safety equipment, electronics, canvas, etc.). Set aside 20-30% of your purchase budget for these immediate costs.",
      },
    ],
    filters: {
      lengthMin: 6,
      lengthMax: 12,
    },
    maxResults: 15,
    icon: "🧭",
  },
  {
    id: "what-size-cruiser-need",
    type: "what-size-cruiser",
    title: "What Size Cruising Sailboat Do I Need?",
    description:
      "Understand the trade-offs between boat size and find the right fit for your cruising plans.",
    intro: `Boat size is one of the most common questions for aspiring cruisers, yet the answer depends entirely on your plans, crew, and budget. This guide breaks down the characteristics of different size ranges and helps you identify the sweet spot for your sailing lifestyle. Remember: the best boat size is one you can handle safely, afford to maintain, and enjoy living aboard.`,
    faqs: [
      {
        question: "What size is best for solo cruising?",
        answer:
          "Most solo cruisers find boats 30-40 feet (9-12 meters) ideal. Smaller boats are easier to handle but lack space for provisions and comfort. Larger boats become physically demanding to manage alone in heavy weather. A well-designed 35-footer with good winches, autopilot, and manageable sails represents the sweet spot for many single-handed sailors.",
      },
      {
        question: "How does boat size affect marina costs?",
        answer:
          "Marina fees typically increase by length, so larger boats cost significantly more to dock. A 40-foot boat might cost 30-50% more per month than a 35-foot boat in the same marina. However, this difference shrinks in percentage terms as boats get larger. For liveaboards cruising seasonally, annual marina costs can exceed $10,000 in popular areas.",
      },
      {
        question: "What are the maintenance differences between small and large cruisers?",
        answer:
          "Larger boats generally have more systems to maintain (engines, generators, watermakers, air conditioning), larger sail inventories, and more surface area to paint and varnish. Annual maintenance costs scale roughly with boat length, though systems complexity is a bigger factor. Some estimate 10% of boat value annually for maintenance, though DIY cruisers spend less.",
      },
      {
        question: "Can a small boat cross oceans?",
        answer:
          "Absolutely. Many sailors have crossed oceans in boats under 30 feet, and some have circumnavigated in sub-30-foot vessels. However, small boats carry fewer provisions, have limited tankage, and can be more uncomfortable in rough conditions. Most people prefer 35-45 feet for comfort and safety on ocean passages, but skill and preparation matter more than size.",
      },
    ],
    filters: {
      lengthMin: 8,
      lengthMax: 15,
    },
    maxResults: 20,
    icon: "📏",
  },
  {
    id: "new-vs-used-buying-guide",
    type: "new-vs-used",
    title: "New vs Used Sailboats: A Complete Guide",
    description:
      "Weigh the pros and cons of new versus used sailboats to make the right choice for your situation.",
    intro: `The new vs used debate is one of the most fundamental decisions in sailboat buying. New boats offer warranty, customization, and peace of mind, but at a premium price. Used boats provide more value for money and may already have desired upgrades, but require careful inspection and potential repairs. This guide helps you evaluate which option makes the most sense for your goals, budget, and risk tolerance.`,
    faqs: [
      {
        question: "What are the main advantages of buying a new sailboat?",
        answer:
          "New boats come with manufacturer warranties (typically 5-10 years on hull, 1-5 years on systems), allowing you to specify equipment and layout exactly as desired. You get pristine condition, no deferred maintenance issues, and modern technology. However, new boats suffer significant depreciation in the first few years, especially compared to used alternatives.",
      },
      {
        question: "What are the main advantages of buying a used sailboat?",
        answer:
          "Used boats offer the most value for money, with depreciation already absorbed by previous owners. Many used boats come with valuable upgrades (electronics, canvas, anchors, etc.) that would cost thousands to add to a new boat. You can inspect a used boat's actual condition and get a survey to identify any issues before purchase.",
      },
      {
        question: "What age is considered 'old' for a sailboat?",
        answer:
          "Age matters less than condition. A well-maintained 30-year-old boat can be superior to a neglected 10-year-old boat. Key factors include osmosis (fiberglass blistering), engine hours, standing rigging age, deck condition, and electronics age. Many fiberglass boats built in the 1980s-90s are still sailing strong with proper care.",
      },
      {
        question: "How much depreciation should I expect on a new sailboat?",
        answer:
          "New sailboats typically lose 15-25% of their value in the first year, and 40-50% after 5 years, depending on brand and market conditions. After 10 years, depreciation slows significantly. A 10-year-old boat in good condition often holds its value relatively well if properly maintained, especially for reputable brands.",
      },
    ],
    filters: {
      lengthMin: 8,
      lengthMax: 14,
    },
    maxResults: 15,
    icon: "⚖️",
  },
  {
    id: "monohull-vs-catamaran-explained",
    type: "x-vs-y-explained",
    title: "Monohull vs Catamaran: Explained",
    description:
      "A detailed comparison of monohull sailboats and catamarans to help you decide which is right for your sailing style.",
    intro: `The choice between monohull and catamaran is one of the most fundamental decisions in sailboat selection. Monohulls have been the traditional choice for centuries, offering familiar handling, upwind performance, and the romantic heeling experience. Catamarans provide stability, space, and speed, revolutionizing modern sailing. Understanding the key differences in design, performance, and livability will help you choose the right platform for your adventures.`,
    faqs: [
      {
        question: "What are the main performance differences between monohulls and catamarans?",
        answer:
          "Monohulls generally point higher and sail faster upwind, especially in choppy conditions. Catamarans often sail faster on reaches and downwind, benefitting from less drag. Monohulls can self-right if capsized in most cases, while catamarans generally cannot. Monohulls heel, which can be uncomfortable but provides feedback; catamarans sail flat, which many find more comfortable.",
      },
      {
        question: "Are catamarans harder to dock and maneuver than monohulls?",
        answer:
          "Catamarans have twin engines spaced far apart, giving them excellent maneuverability in close quarters. They can spin in their own length and have powerful thrust from two props. Monohulls have a single prop and rely on rudder angle and prop walk for maneuvering. Both have learning curves, but many find catamarans easier to handle in tight spaces once you master the twin-engine technique.",
      },
      {
        question: "How does space and comfort compare between monohulls and catamarans?",
        answer:
          "Catamarans offer significantly more interior space due to their wide beam. You get two hulls, a large saloon, and typically more deck space. This means more privacy (separate hulls), shallower draft for anchoring close to beaches, and level sailing. Monohulls have cozy, efficient layouts with good sea berths for offshore sailing but less overall living space and headroom.",
      },
      {
        question: "Are catamarans more expensive to buy and maintain than monohulls?",
        answer:
          "Catamarans are typically more expensive to buy than equivalent monohulls due to more materials (two hulls, two engines, more surface area). Maintenance is also higher: two engines to service, two of many systems, and more bottom paint. However, marina fees can be challenging since many marinas charge by beam length, making wide catamarans expensive to dock.",
      },
      {
        question: "Which is safer: monohull or catamaran?",
        answer:
          "Both can be extremely safe when designed and maintained properly. Monohulls have the advantage of self-righting in most capsize scenarios. Catamarans are extremely stable and rarely capsize, but if they do, they often stay inverted. Both types have completed safe ocean crossings. Safety ultimately comes down to the skipper's judgment, preparation, and seamanship skills rather than hull configuration.",
      },
      {
        question: "What are the anchoring advantages of catamarans?",
        answer:
          "Catamarans have shallow draft (typically 3-5 feet) compared to monohulls (6-9 feet), allowing them to anchor much closer to beaches and in shallower water. This is a huge advantage in popular cruising areas where deep-water anchorages are crowded. The wide beam also provides a very stable platform at anchor, reducing rolling motion compared to monohulls.",
      },
    ],
    filters: {
      lengthMin: 8,
      lengthMax: 15,
    },
    maxResults: 12,
    icon: "⛵🐱",
  },
  {
    id: "fin-keel-vs-wing-keel-explained",
    type: "x-vs-y-explained",
    title: "Fin Keel vs Wing Keel: Explained",
    description:
      "Understanding the differences between fin keels and wing keels for different sailing conditions and preferences.",
    intro: `Keel design significantly affects a sailboat's performance, handling, and where you can sail. Fin keels are the most common configuration on modern sailboats, offering excellent upwind performance and directional stability. Wing keels provide a shallower draft alternative, allowing access to shallow cruising grounds while maintaining reasonable performance. The choice between these two designs often comes down to your sailing grounds and performance priorities.`,
    faqs: [
      {
        question: "What is a fin keel and how does it perform?",
        answer:
          "A fin keel is a relatively narrow, deep keel that extends straight down from the hull. Fin keels offer excellent upwind performance, good tracking, and efficient hydrodynamics. They allow the boat to sail close to the wind and typically point higher than other keel types. The trade-off is deeper draft, which limits access to shallow anchorages and some harbors.",
      },
      {
        question: "What is a wing keel and when would you choose one?",
        answer:
          "A wing keel has a horizontal wing or bulb at the bottom, often with a shallower depth than a traditional fin keel. Wing keels are designed to reduce draft while maintaining ballast weight and some performance benefits. They're ideal for sailors in areas with shallow waters, such as the Bahamas, Chesapeake Bay, or inland lakes, where a deep keel would be limiting.",
      },
      {
        question: "How does performance compare between fin keels and wing keels?",
        answer:
          "Fin keels generally offer better upwind performance, higher pointing ability, and less drag. Wing keels sacrifice some upwind performance and pointing ability for reduced draft. The performance difference isn't dramatic for cruising sailors, but racers and performance-oriented sailors typically prefer fin keels for their superior windward performance.",
      },
      {
        question: "Are wing keels better for shallow water cruising?",
        answer:
          "Absolutely. The primary advantage of wing keels is reduced draft, allowing you to anchor in shallower water and access harbors that deep-keel boats cannot. This opens up many popular cruising destinations like the Bahamas, Florida Keys, and parts of the Caribbean. If your sailing dreams involve shallow anchorages, a wing keel may be the right choice.",
      },
      {
        question: "How do maintenance and repair considerations differ?",
        answer:
          "Both keel types require regular inspection for corrosion, loose bolts, and damage. Wing keels can be more complex to haul and block due to their shape, and some boatyards are less familiar with them. Fin keels are straightforward and universally understood. If groundings occur, wing keels can suffer damage to the wing structure that may be more challenging to repair than a simple fin keel.",
      },
      {
        question: "What about handling and maneuverability?",
        answer:
          "Both keel types provide good directional stability when sailing. The differences are most noticeable when backing down or maneuvering in tight spaces. Wing keels may have different characteristics when backing due to their shape, but most sailors adapt quickly. For day-to-day handling under sail, the differences are minor for cruising sailors.",
      },
    ],
    filters: {
      lengthMin: 8,
      lengthMax: 14,
    },
    maxResults: 10,
    icon: "⚓🪽",
  },
  {
    id: "cutter-vs-sloop-rig-explained",
    type: "x-vs-y-explained",
    title: "Cutter Rig vs Sloop Rig: Explained",
    description:
      "Comparing cutter and sloop rig configurations for different sailing styles and conditions.",
    intro: `The choice between cutter and sloop rigs affects sail handling, versatility, and sailing performance. The sloop is the simplest and most common rig, with a single mast and two sails (mainsail and headsail). The cutter adds a second headsail (staysail) on an inner forestay, offering more flexibility and sail combinations. Understanding these configurations helps you choose a rig that matches your sailing style and crew size.`,
    faqs: [
      {
        question: "What is a sloop rig?",
        answer:
          "A sloop rig is the most common sailboat configuration, featuring a single mast supporting a mainsail and a single headsail (usually a genoa or jib). Sloops are simple to set up, have fewer lines to manage, and offer excellent performance. With just two sails, sail handling is straightforward, making sloops popular for racing and coastal cruising.",
      },
      {
        question: "What is a cutter rig?",
        answer:
          "A cutter rig features a mast set slightly further aft with two headsails: a larger outer headsail (yankee or genoa) and a smaller inner staysail. The staysail is set on an inner forestay and can be reefed or furled independently. This configuration offers more sail area options and better balance in a wider range of wind conditions.",
      },
      {
        question: "What are the advantages of a sloop rig?",
        answer:
          "Sloops are simple with fewer sails to manage, making them ideal for shorthanded sailing. They have excellent performance, especially upwind, with less windage and drag. With fewer components, there's less maintenance and lower cost. Sloops are also easier to dock and handle in tight spaces due to the simpler mast setup.",
      },
      {
        question: "What are the advantages of a cutter rig?",
        answer:
          "Cutters offer superior versatility with multiple sail combinations. In heavy weather, you can reef the genoa and keep the staysail flying for balanced performance. The staysail can be set on its own in light air or combined with other sails. Cutters also provide better balance in reaching conditions and are favored by many offshore cruisers for their adaptability.",
      },
      {
        question: "Which rig is better for offshore cruising?",
        answer:
          "Many offshore cruisers prefer cutter rigs for their versatility. The ability to vary sail combinations for different wind conditions is valuable on long passages. The staysail provides a good heavy-weather sail option, and the rig can be balanced without relying on large overlapping headsails that can be challenging to handle short-handed.",
      },
      {
        question: "Which rig is better for coastal and day sailing?",
        answer:
          "Sloops are often preferred for coastal and day sailing due to their simplicity. With just two sails to manage, you can spend more time enjoying the sail and less time managing the rig. Sloops also tend to have better light-wind performance with large overlapping headsails, which is common in coastal sailing conditions.",
      },
      {
        question: "How do windward performance compare between the two?",
        answer:
          "Sloops typically have the edge in pure upwind performance, especially with large overlapping genoas. Cutters sacrifice some upwind pointing ability due to the mast position and multiple headsails, but this is rarely a concern for cruising sailors. Both can sail efficiently to windward; the difference is more noticeable in racing than cruising.",
      },
    ],
    filters: {
      lengthMin: 10,
      lengthMax: 15,
    },
    maxResults: 10,
    icon: "⛵🔺",
  },
];

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): BuyingGuideTemplate | undefined {
  return BUYING_GUIDE_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get templates by type
 */
export function getTemplatesByType(type: GuideType): BuyingGuideTemplate[] {
  return BUYING_GUIDE_TEMPLATES.filter((t) => t.type === type);
}

/**
 * Get all templates
 */
export function getAllTemplates(): BuyingGuideTemplate[] {
  return BUYING_GUIDE_TEMPLATES;
}

/**
 * Convert template filters to API query params
 */
export function templateFiltersToQueryParams(
  filters: BuyingGuideFilter
): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.lengthMin !== undefined) {
    params[`filters[lengthMin]`] = filters.lengthMin.toString();
  }
  if (filters.lengthMax !== undefined) {
    params[`filters[lengthMax]`] = filters.lengthMax.toString();
  }
  if (filters.cabinsMin !== undefined) {
    params[`filters[cabinsMin]`] = filters.cabinsMin.toString();
  }
  if (filters.cabinsMax !== undefined) {
    params[`filters[cabinsMax]`] = filters.cabinsMax.toString();
  }
  if (filters.keelType) {
    params[`filters[keelType]`] = filters.keelType;
  }
  if (filters.rigType) {
    params[`filters[rigType]`] = filters.rigType;
  }
  if (filters.hullMaterial) {
    params[`filters[hullMaterial]`] = filters.hullMaterial;
  }
  if (filters.displacementMin !== undefined) {
    params[`filters[displacementMin]`] = filters.displacementMin.toString();
  }
  if (filters.displacementMax !== undefined) {
    params[`filters[displacementMax]`] = filters.displacementMax.toString();
  }

  return params;
}

/**
 * Generate FAQPage JSON-LD
 */
export function generateFAQPageJsonLd(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate BuyingGuideArticle JSON-LD (Article + FAQPage combined)
 */
export function generateBuyingGuideJsonLd(
  title: string,
  description: string,
  slug: string,
  faqs: FAQ[],
  publishedAt?: string | Date | null,
  author?: string | null
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: title,
        description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/guides/${slug}`,
        author: author
          ? {
              "@type": "Person",
              name: author,
            }
          : undefined,
        publisher: {
          "@type": "Organization",
          name: "Sailing Yachts Database",
          url: process.env.NEXT_PUBLIC_SITE_URL || "",
        },
        datePublished: publishedAt
          ? new Date(publishedAt).toISOString()
          : undefined,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${process.env.NEXT_PUBLIC_SITE_URL || ""}/guides/${slug}`,
        },
      },
      generateFAQPageJsonLd(faqs),
    ],
  };
}
