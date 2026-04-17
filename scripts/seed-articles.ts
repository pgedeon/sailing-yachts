import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL!;
const sql = neon(DATABASE_URL);

const articles = [
  {
    slug: "how-to-choose-your-first-sailboat",
    title: "How to Choose Your First Sailboat",
    excerpt:
      "A comprehensive guide for first-time boat buyers covering budget, size, keel type, rig, and intended use to help you find the perfect starter sailboat.",
    category: "buying-guide",
    author: "Sailing Yacht Info",
    author_title: "Marine Research Team",
    reading_time_minutes: 8,
    content_markdown: `## Introduction

Choosing your first sailboat is one of the most exciting decisions you will make as a aspiring sailor. Whether you dream of weekend coastal cruises, liveaboard adventures, or competitive racing, the right boat can make all the difference.

This guide walks you through the key factors to consider when selecting your first sailboat, from budget and size to keel type and rig configuration.

## Define Your Sailing Goals

Before looking at listings, ask yourself:

- **Where will you sail?** Coastal waters, inland lakes, or offshore passages?
- **How many people?** Solo, couple, or family with crew?
- **What's your experience level?** Complete beginner, dinghy sailor, or experienced crew?

## Budget Considerations

Your budget should account for more than just the purchase price:

| Expense | Typical Range |
|---------|--------------|
| Purchase price | $5,000–$100,000+ |
| Annual mooring/marina | $1,500–$8,000 |
| Insurance | $500–$3,000/year |
| Maintenance | 10% of boat value/year |

## Size and LOA (Length Overall)

For first-time owners, **30 to 36 feet** is generally the sweet spot:

- **Under 28 ft**: Easy to handle but limited space and comfort
- **28–34 ft**: Great balance of handling and livability
- **35–40 ft**: More space but requires more skill and crew
- **Over 40 ft**: Best for experienced sailors

## Keel Types Explained

The keel affects stability, draft, and performance:

- **Fin keel**: Best performance, deeper draft (5–6 ft)
- **Wing keel**: Shoal draft option (3.5–4.5 ft), good for shallow areas
- **Full keel**: Maximum stability, forgiving handling, deeper draft
- **Lift keel**: Adjustable draft, versatile for different waters

## Rig Options

### Sloop (Most Popular)
Single mast with a mainsail and headsail (jib or genoa). Simple, efficient, and the most common rig for cruisers.

### Cutter
Similar to sloop but with an additional staysail. Offers more sail area options in heavy weather.

### Ketch
Two masts with the mizzen mast aft of the rudder post. Good for shorthanded sailing with smaller individual sails.

## Recommended Starter Sailboats

Some excellent first sailboats to consider:

- **Beneteau Oceanis 31** — Easy handling, modern design
- **Jeanneau Sun Odyssey 349** — Versatile cruiser with great performance
- **Hanse 315** — Self-tacking jib, easy single-handing
- **Bavaria Cruiser 34** — Spacious interior, good value

## Survey and Purchase Tips

Always get a professional survey before purchasing:

1. Hire a certified marine surveyor
2. Conduct a sea trial
3. Check for osmosis and hull delamination
4. Inspect the rig, sails, and engine
5. Review maintenance records

## Conclusion

The best first sailboat is one that matches your goals, fits your budget, and inspires confidence. Start with a well-maintained used boat in the 30–36 foot range, and you will have years of enjoyable sailing ahead.`,
  },
  {
    slug: "understanding-sailboat-specifications",
    title: "Understanding Sailboat Specifications: A Complete Guide",
    excerpt:
      "Learn what LOA, beam, draft, displacement, ballast ratio, and other key specs mean — and why they matter when comparing sailing yachts.",
    category: "educational",
    author: "Sailing Yacht Info",
    author_title: "Marine Research Team",
    reading_time_minutes: 10,
    content_markdown: `## Why Specs Matter

Sailboat specifications tell the story of a boat's character, performance potential, and suitability for different sailing conditions. Understanding these numbers helps you make informed comparisons between models.

This guide explains every major specification you will encounter when browsing yacht listings.

## Dimensions

### LOA (Length Overall)
The total length of the boat from bow to stern, measured in feet or meters. Longer boats are generally faster, more stable, and more spacious — but also more expensive to maintain and berth.

### LWL (Waterline Length)
The length of the boat at the waterline. LWL is the primary determinant of **hull speed** — the theoretical maximum speed of a displacement hull:

**Hull Speed (knots) ≈ 1.34 × √LWL (feet)**

### Beam
The widest point of the boat. More beam means more interior space and initial stability, but can reduce comfort in rough seas (more roll).

### Draft
The depth of the boat below the waterline. Critical for navigation in shallow waters:

- **Shoal draft** (< 4 ft): Access to shallow anchorages and intracoastal waterways
- **Standard draft** (4–6 ft): Good all-round performance
- **Deep draft** (> 6 ft): Maximum upwind performance

## Weight and Stability

### Displacement
The total weight of the boat, typically measured in kilograms or pounds. Heavier boats tend to be more comfortable in rough seas but slower in light winds.

### Ballast
Weight placed low in the hull (typically in the keel) to provide righting moment. More ballast relative to displacement means greater stability.

### Ballast Ratio
**Ballast Ratio = Ballast ÷ Displacement × 100%**

- **Below 30%**: Light, performance-oriented
- **30–40%**: Balanced cruiser
- **Above 40%**: Heavy, stable, bluewater-capable

## Performance Indicators

### Sail Area / Displacement Ratio (SA/D)
Measures power-to-weight:

- **Below 14**: Heavy displacement, motorsailer territory
- **14–18**: Moderate, comfortable cruiser
- **18–22**: Performance cruiser
- **Above 22**: High-performance racing boat

### Displacement / Length Ratio (D/L)
Indicates how heavy the boat is relative to its length:

- **Below 100**: Ultra-light (racing sleds)
- **100–200**: Light (performance cruisers)
- **200–300**: Moderate (typical production cruisers)
- **300–400**: Heavy (bluewater cruisers)
- **Above 400**: Very heavy (traditional full-keel designs)

## Comfort and Safety Ratios

### Motion Comfort Index
Developed by Ted Brewer, this estimates how comfortable a boat will be in rough seas. Higher numbers indicate a more comfortable ride.

### Capsize Screening Formula (CSF)
**CSF = Beam ÷ (Displacement/64)^(1/3)**

- **Below 2.0**: Suitable for offshore passages
- **Above 2.0**: Better suited for coastal cruising

## Rig and Sail Measurements

- **I**: Height of the foretriangle (from deck to masthead)
- **J**: Base of the foretriangle (from mast to forestay attachment)
- **P**: Height of the mainsail luff
- **E**: Length of the mainsail foot

These measurements determine sail area and replacement sail sizes.

## Using Specs to Compare Yachts

When comparing two or more sailboats, focus on:

1. **D/L and SA/D ratios** for overall character
2. **Ballast ratio and CSF** for seaworthiness
3. **Draft** for your sailing area
4. **LOA and beam** for marina costs and interior space

Use our [yacht comparison tool](/compare) to see specs side by side.`,
  },
  {
    slug: "best-bluewater-cruising-sailboats",
    title: "Best Bluewater Cruising Sailboats for Ocean Passages",
    excerpt:
      "Our expert picks for the most capable bluewater cruising sailboats, from proven production boats to expedition-grade vessels built for ocean crossings.",
    category: "buying-guide",
    author: "Sailing Yacht Info",
    author_title: "Marine Research Team",
    reading_time_minutes: 9,
    content_markdown: `## What Makes a Bluewater Sailboat?

Bluewater sailing demands a boat that can withstand heavy weather, be repaired at sea, and keep its crew safe across thousands of ocean miles. Not every production cruiser is cut out for ocean crossings.

Key bluewater qualities include:

- **Strong construction**: Solid laminate hull, robust deck hardware
- **Stability**: High ballast ratio, low center of gravity
- **Seakindly motion**: Comfortable in rough conditions
- **Self-sufficiency**: Large fuel and water tanks, redundant systems
- **Heavy-weather capability**: Storm sails, strong rig, protected cockpit

## Best Bluewater Sailboats by Size

### 35–40 Feet

**Hallberg-Rassy 372**
Swedish-built, center cockpit design with exceptional build quality. Self-tacking jib, skeg-hung rudder, and a sailplan optimized for shorthanded sailing.

**Amel 36**
French-designed with a distinctive ketch rig. Known for exceptional seaworthiness and comfort. Practical layout for long-term liveaboard.

### 40–45 Feet

**Hallberg-Rassy 44**
The gold standard in production bluewater cruising. Exceptional build quality, comfortable interior, and outstanding heavy-weather performance.

**Outremer 45**
A performance catamaran capable of fast ocean passages. Light displacement, daggerboards, and excellent helm balance make it a favorite for trade-wind routes.

**Tayana 42**
A heavy-displacement cutter with a full keel. Traditional bluewater pedigree with solid fiberglass construction and a spacious interior.

### 45–55 Feet

**Amel 50**
Purpose-built for ocean cruising with a unique super-maramu design. All lines led to the cockpit, ketch rig, and legendary French build quality.

**Hallberg-Rassy 48**
Center cockpit cruiser with exceptional offshore capability. Spacious, well-protected, and capable of comfortable passages in any weather.

## Key Features to Look For

### Construction
- Solid fiberglass hull (avoid cored hulls below the waterline)
- Substantial hull-to-deck joint (bolted, not just bonded)
- Reinforced chainplates and rig attachment points

### Rig
- Cutter or cutter-headed sloop for sail versatility
- Oversized standing rigging wire
- Backup running backstays or staysail stay

### Cockpit
- Small, deep cockpit (drains quickly if pooped)
- Strong cockpit combings for security
- All control lines led aft

## Bluewater Preparation Checklist

Before setting off on an ocean passage:

1. Install a life raft and EPIRB
2. Carry storm sails (heavy-weather jib, trysail)
3. Install a windvane self-steering system
4. Carry comprehensive spares (rig, engine, electrical)
5. Install a watermaker or carry emergency water
6. Practice man-overboard procedures regularly

## Conclusion

The best bluewater boat is one you trust completely. Choose a design with proven offshore credentials, invest in thorough preparation, and build your skills through progressive coastal passages before setting off across oceans.`,
  },
  {
    slug: "sailboat-maintenance-essentials",
    title: "Sailboat Maintenance Essentials: A Seasonal Guide",
    excerpt:
      "Keep your sailboat in top condition with this comprehensive maintenance guide covering hull care, rig inspection, engine service, and seasonal checklists.",
    category: "ownership",
    author: "Sailing Yacht Info",
    author_title: "Marine Research Team",
    reading_time_minutes: 7,
    content_markdown: `## Why Regular Maintenance Matters

A well-maintained sailboat is safer, more reliable, and retains its value better. Neglect leads to costly repairs and potentially dangerous failures at sea.

This guide covers essential maintenance tasks organized by season and system.

## Spring Commissioning

### Hull and Bottom
- Inspect hull for blisters, cracks, or osmosis damage
- Clean and repaint antifouling bottom paint (annual)
- Check through-hull fittings and seacocks — operate each one
- Inspect propeller, shaft, and cutless bearing

### Rig
- Inspect standing rigging for broken strands, corrosion, or elongation
- Check turnbuckle tension and cotter pins
- Inspect mast step and chainplates for corrosion
- Check running rigging for chafe and UV damage

### Engine
- Change oil and oil filter
- Replace raw water impeller (annual)
- Check coolant level and condition
- Inspect fuel filters and replace if needed
- Test all engine alarms and gauges

### Safety Equipment
- Inspect fire extinguishers and replace if expired
- Test CO and smoke detectors
- Check flares expiration dates
- Inspect lifejackets and harnesses
- Test VHF radio and AIS transponder

## Summer Maintenance

### Ongoing Tasks
- Wash down the deck and cockpit weekly
- Inspect rig tension before each sail
- Check bilge pumps and float switches monthly
- Lubricate seacocks periodically
- Monitor engine coolant temperature and oil pressure

### Sail Care
- Rinse sails with fresh water after saltwater exposure
- Inspect stitching and reef points for wear
- Store sails properly when not in use
- Repair small tears promptly before they grow

## Fall Haul-Out

### Hull
- Pressure wash hull immediately after haul-out
- Inspect for new blisters or damage
- Sand and repair any fiberglass damage
- Apply barrier coat if needed

### Winterization
- Drain fresh water system and add antifreeze
- Winterize engine (drain raw water, add antifreeze)
- Remove sails, canvas, and electronics for indoor storage
- Charge batteries and disconnect or remove
- Ventilate cabin to prevent mold

### Rig
- If mast is unstepped, inspect all fittings and sheaves
- Check spreader tips and attachment points
- Replace any suspect rigging wire

## Annual Professional Inspections

Some tasks require professional expertise:

| Task | Frequency | Professional? |
|------|-----------|---------------|
| Rig survey | Every 2–3 years | Yes |
| Engine service | Annually | Recommended |
| Standing rigging replacement | Every 10–15 years | Yes |
| Hull survey (insurance) | Every 5 years | Yes |
| Fire extinguisher inspection | Annually | Recommended |

## Budgeting for Maintenance

A good rule of thumb is **10% of the boat's value per year** for maintenance. For a $50,000 sailboat:

- **$2,000–$3,000**: Haul-out, bottom paint, basic maintenance
- **$1,000–$2,000**: Engine service and parts
- **$500–$1,000**: Rig inspection and small repairs
- **$500–$1,000**: Safety equipment and replacements
- **$1,000**: Contingency for unexpected repairs

## Conclusion

Consistent, proactive maintenance is far cheaper than reactive repairs. Follow these seasonal checklists, keep detailed maintenance logs, and your sailboat will reward you with reliable performance for years to come.`,
  },
  {
    slug: "monohull-vs-catamaran-comparison",
    title: "Monohull vs Catamaran: Which Is Right for You?",
    excerpt:
      "An honest comparison of monohull and catamaran sailboats covering performance, comfort, cost, safety, and liveaboard suitability to help you choose.",
    category: "comparison",
    author: "Sailing Yacht Info",
    author_title: "Marine Research Team",
    reading_time_minutes: 8,
    content_markdown: `## The Great Debate

One of the most discussed questions in sailing: monohull or catamaran? The answer depends entirely on how you plan to use the boat. Both designs have genuine strengths and weaknesses.

This guide provides an objective comparison to help you make the right choice.

## Stability and Motion

### Monohull
- Heels under sail (typically 15–25 degrees)
- Rounded motion that many sailors find natural
- Self-righting after a capsize (inherently stable)
- More pronounced roll at anchor

### Catamaran
- Minimal heel (typically 3–5 degrees)
- Level sailing experience
- **Does not self-right** if inverted
- Very stable at anchor — minimal roll

## Performance

| Factor | Monohull | Catamaran |
|--------|----------|-----------|
| Upwind performance | Excellent | Moderate |
| Downwind speed | Good | Excellent (often 50% faster) |
| Light air performance | Moderate | Good (low drag) |
| Heavy weather handling | Excellent | Requires care |

Monohulls point higher into the wind and have superior upwind VMG. Catamarans excel on reaching and downwind angles, often achieving speeds 1.5–2× that of comparable monohulls.

## Space and Comfort

### Monohull
- Narrow beam limits interior width
- Deeper bilge and keel structure uses space
- Typically 1–2 cabins in 35–40 ft range
- Galley and head more compact

### Catamaran
- Massive beam creates enormous living space
- Two separate hulls offer privacy (engine rooms, cabins)
- Typically 3–4 cabins in 38–42 ft range
- Large saloon with 360° visibility
- Trampoline area forward for relaxing

A 40-foot catamaran typically offers the living space of a 50-foot monohull.

## Cost Comparison

### Purchase Price
Catamarans typically cost **30–50% more** than comparable-length monohulls due to more complex construction (two hulls, bridgedeck).

### Operating Costs

| Expense | Monohull | Catamaran |
|---------|----------|-----------|
| Marina berth | Standard rate | 1.5–2× rate (wide beam) |
| Haul-out | Standard | Requires travel lift |
| Bottom paint | Single hull | Two hulls + bridgedeck |
| Engine maintenance | One engine | Two engines |
| Mooring | Standard | Requires wider mooring |

## Safety Considerations

### Monohull Advantages
- **Self-righting**: If knocked down, a monohull comes back up
- **Single point of failure**: One engine, one hull — simpler systems
- **Proven offshore pedigree**: Decades of ocean-crossing history

### Catamarull Advantages
- **Redundancy**: Two engines, two hulls — if one fails, the other works
- **No sinking from small hole**: Foam-core construction provides flotation
- **Level sailing**: Reduces fatigue and seasickness

### Catamaran Risks
- **Capsize is catastrophic**: If flipped, stays inverted
- **Bridge deck slamming**: In rough seas, waves slam under the bridgedeck
- **Windage**: High freeboard makes docking and close-quarters maneuvering harder

## Liveaboard Suitability

For full-time living aboard:

**Choose a monohull if:**
- You enjoy the "sailing experience" of heeling
- Budget is a primary concern
- You plan to do offshore passages
- Marina costs are a concern

**Choose a catamaran if:**
- Comfort and space are priorities
- You sail mostly in protected or coastal waters
- Your partner/family prefers level sailing
- You entertain guests frequently

## Charter Experience

Many sailors recommend chartering both types before making a purchase decision. A week-long charter of each type will tell you more than any article can.

## Conclusion

There is no universally "better" choice. Monohulls offer a more traditional sailing experience with proven offshore capability at lower cost. Catamarans deliver unmatched space, comfort, and downwind speed at a premium price. The right answer is the one that matches your sailing plans, budget, and personal preferences.`,
  },
];

async function main() {
  console.log("Seeding articles...");

  for (const article of articles) {
    const result = await sql`
      INSERT INTO articles (
        slug, title, excerpt, content, content_markdown, category,
        author, author_title, reading_time_minutes,
        is_published, published_at, created_at, updated_at
      ) VALUES (
        ${article.slug},
        ${article.title},
        ${article.excerpt},
        ${article.content_markdown},
        ${article.content_markdown},
        ${article.category},
        ${article.author},
        ${article.author_title},
        ${article.reading_time_minutes},
        true,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        content_markdown = EXCLUDED.content_markdown,
        content = EXCLUDED.content,
        category = EXCLUDED.category,
        author = EXCLUDED.author,
        author_title = EXCLUDED.author_title,
        reading_time_minutes = EXCLUDED.reading_time_minutes,
        is_published = EXCLUDED.is_published,
        published_at = EXCLUDED.published_at,
        updated_at = NOW()
      RETURNING id, slug
    `;
    console.log(`  Upserted: ${result[0].slug} (id=${result[0].id})`);
  }

  const count = await sql`SELECT count(*) as total FROM articles WHERE is_published = true`;
  console.log(`\nDone. Published articles: ${count[0].total}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
