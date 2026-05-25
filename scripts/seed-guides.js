/**
 * Seed additional buying guides and educational articles
 * Run: node scripts/seed-guides.js
 */
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const guides = [
  {
    slug: 'best-family-sailboats-under-40-feet',
    title: 'Best Family Sailboats Under 40 Feet (2026 Edition)',
    excerpt: 'Discover the top family-friendly sailboats under 40 feet, ranked by cabin space, stability, ease of handling, and value. Based on data from 243 models across 42 manufacturers.',
    category: 'buying-guide',
    reading_time_minutes: 8,
    md: `# Best Family Sailboats Under 40 Feet (2026 Edition)

Choosing a family sailboat means balancing **space, safety, stability, and simplicity**. This guide covers the best options under 40 feet (12m) LOA — the sweet spot for family cruising — using data from our database of 243 yacht models across 42 manufacturers.

## What Makes a Great Family Sailboat?

### 1. Cabin & Berth Count
Families need at least **2 cabins and 4 berths**. Three cabins are ideal for growing families or guests. Look for:
- Forward owner's cabin (double berth)
- Aft cabins (twin or double)
- Convertible saloon berths

### 2. Draft & Keel Options
Shallow draft (under 1.5m) opens up more anchorages and coastal cruising grounds. **Wing keels** and **shoal draft** options are popular for family boats.

### 3. Ease of Handling
- **Sloop rig** is simplest for short-handed sailing
- **Self-tacking jib** options reduce deck work
- **Electric winches** and **roller furling** are family-friendly features

### 4. Safety & Stability
Look for **ballast ratios above 30%** and positive stability curves. Fin keel designs with moderate beam offer predictable handling.

## Top Picks by Category

### Best Overall Family Cruiser: Beneteau Oceanis 38.1
The Oceanis 38.1 offers an ideal balance of space, performance, and value. Available in 2 or 3 cabin configurations with a choice of draft options.

### Best Value: Bavaria Cruiser 34
German engineering at a competitive price point. The Cruiser 34 packs surprising interior volume into a 34-foot hull.

### Best for Shallow Waters: Jeanneau Sun Odyssey 349
With a shoal draft option under 1.5m, the SO 349 is perfect for coastal family cruising and exploring hidden anchorages.

### Best Performance Cruiser: Dehler 38
For families who also enjoy club racing, the Dehler 38 delivers sporty performance without sacrificing cruising comfort.

## How to Compare Models

Use our [Yacht Comparison Tool](/compare) to compare up to 3 models side by side with detailed specs, or try the [Yacht Finder](/yachts/finder) to get personalized recommendations.

## Key Specs to Compare

| Spec | Why It Matters | Typical Range |
|------|---------------|---------------|
| LOA | Overall size & cost | 30–40 ft (9–12m) |
| Draft | Accessibility of anchorages | 1.3–2.1m |
| Cabins | Sleeping arrangements | 2–3 |
| Displacement | Stability & comfort | 4,000–8,000 kg |
| Ballast Ratio | Safety margin | 28–38% |

## Ready to Explore?

[Browse all yachts under 40 feet →](/yachts?filters%5BlengthMax%5D=12)

---

*This guide was compiled using specification data from our database of 243 yacht models. Last updated May 2026.*`
  },
  {
    slug: 'sailboat-keel-types-explained',
    title: 'Sailboat Keel Types Explained: Fin, Wing, Full & More',
    excerpt: 'Complete guide to sailboat keel types — fin keel, wing keel, full keel, bulb keel, and lifting keel. Learn how each type affects performance, stability, draft, and cruising capability.',
    category: 'educational',
    reading_time_minutes: 10,
    md: `# Sailboat Keel Types Explained

The keel is arguably the most important underwater feature of any sailboat. It provides **lateral resistance** (preventing sideways drift), **righting moment** (keeping the boat upright), and often carries **ballast** weight low in the hull.

Understanding keel types is essential for choosing the right yacht for your sailing goals. This guide covers every major keel type with pros, cons, and real-world examples.

## Why Keel Type Matters

- **Performance**: Fin keels offer less drag and better upwind angles
- **Draft**: Wing and shoal-draft keels allow access to shallow waters
- **Maintenance**: Some keel types require more upkeep than others
- **Safety**: Full keels provide better grounding protection

## The Main Keel Types

### 1. Fin Keel

A thin, vertical blade extending below the hull. The most common keel type on modern production sailboats.

**Pros**: Excellent upwind performance, low drag, responsive helm
**Cons**: Deeper draft, less protection when grounding
**Best for**: Performance-oriented sailors, racers, experienced cruisers

[Browse fin-keel yachts →](/yachts?filters%5BkeelType%5D=Fin+Keel)

### 2. Wing Keel

A fin keel with horizontal wings at the bottom. Popularized by Beneteau and Jeanneau.

**Pros**: Reduced draft with maintained stability, good for shallow waters
**Cons**: Slight performance penalty upwind, can collect debris
**Best for**: Coastal cruisers, family sailors, Chesapeake/Bahamas sailors

[Browse wing-keel yachts →](/yachts?filters%5BkeelType%5D=Wing+Keel)

### 3. Full Keel

A keel that runs the full length of the hull, typically with an attached rudder.

**Pros**: Excellent tracking, forgiving handling, protects propeller and rudder
**Cons**: More drag, less maneuverable, deeper draft
**Best for**: Bluewater cruising, heavy displacement yachts

### 4. Bulb Keel

A fin keel with a heavy torpedo-shaped bulb at the bottom for maximum stability.

**Pros**: High righting moment, moderate draft, excellent stability
**Cons**: More expensive to manufacture
**Best for**: Performance cruisers, offshore racing

### 5. Lifting/Retractable Keel

A keel that can be raised or lowered, combining deep-draft performance with shallow-water access.

**Pros**: Variable draft, best of both worlds
**Cons**: Mechanical complexity, higher maintenance, more expensive
**Best for**: Explorers, shallow-water sailors, trailer-sailers

## Choosing the Right Keel for Your Needs

| Sailing Goal | Recommended Keel | Why |
|-------------|-----------------|-----|
| Weekend cruising | Fin keel or wing keel | Good balance of performance and practicality |
| Bluewater passages | Full keel or deep fin | Safety and tracking |
| Shallow coastal waters | Wing keel or shoal draft | Access to anchorages |
| Club racing | Fin keel with bulb | Maximum performance |
| Island hopping | Shoal draft or lifting | Beach access and shallow reefs |

## Compare Keel Types on Real Yachts

Use our [Yacht Comparison Tool](/compare) to see how different keel types affect real-world specifications across 243 models.

---

*Want to learn more sailing terminology? Visit our [Sailing Glossary](/glossary) for definitions of keel types, rig configurations, and hundreds of other nautical terms.*`
  },
  {
    slug: 'sailboat-rig-types-sloop-cutter-ketch',
    title: 'Sailboat Rig Types: Sloop, Cutter, Ketch & More Compared',
    excerpt: 'Understanding sailboat rig types is key to choosing the right yacht. Compare sloop, cutter, ketch, yawl, and schooner rigs with pros, cons, and examples from our database.',
    category: 'educational',
    reading_time_minutes: 9,
    md: `# Sailboat Rig Types: Sloop, Cutter, Ketch & More

The rig type defines how a sailboat's sails are arranged — and it has a profound impact on **handling, performance, and sail plan flexibility**. This guide explains every major rig type with real examples from our database of 243 yacht models.

## Why Rig Type Matters

- **Sail handling**: Some rigs are easier to manage short-handed
- **Performance**: Rig geometry affects upwind efficiency and downwind power
- **Versatility**: Multiple headsails or masts offer more sail combinations
- **Cost**: More complex rigs mean more sails, rigging, and maintenance

## The Main Rig Types

### 1. Sloop Rig (Most Common)

One mast, one headsail (jib), and one mainsail. The simplest and most popular rig on modern sailboats.

**Pros**: Simple to sail, efficient upwind, easy to handle short-handed
**Cons**: Limited sail combinations, large sails can be heavy
**Best for**: 90% of sailors — weekend cruising, club racing, family sailing

[Browse sloop-rigged yachts →](/yachts?filters%5BrigType%5D=Sloop)

### 2. Cutter Rig

One mast with two headsails (staysail and jib) flown from inner and outer forestays.

**Pros**: Excellent heavy-weather options, balanced sail plan, versatile
**Cons**: More rigging complexity, slightly more work to tack
**Best for**: Offshore cruisers, heavy-weather sailors

[Browse cutter-rigged yachts →](/yachts?filters%5BrigType%5D=Cutter)

### 3. Ketch Rig

Two masts: main mast (taller) and mizzen mast (shorter, forward of the rudder).

**Pros**: Smaller individual sails, excellent sail balance, versatile combinations
**Cons**: More rigging to maintain, mizzen can cause wind shadow
**Best for**: Long-distance cruisers, liveaboards, heavy-displacement yachts

[Browse ketch-rigged yachts →](/yachts?filters%5BrigType%5D=Ketch)

### 4. Yawl Rig

Two masts like a ketch, but the mizzen is smaller and located aft of the rudder post.

**Pros**: Classic looks, mizzen helps with balance at anchor
**Cons**: Small mizzen adds complexity without much sail area benefit
**Best for**: Classic yacht enthusiasts, traditionalists

### 5. Schooner Rig

Two or more masts with the foremast shorter than or equal to the main mast.

**Pros**: Impressive sail area, multiple sail combinations, classic appeal
**Cons**: Complex rigging, requires larger crew, higher maintenance
**Best for**: Large cruising yachts, charter vessels, classic designs

## Rig Type Comparison Table

| Rig | Masts | Headsails | Handling | Best For |
|-----|-------|-----------|----------|----------|
| Sloop | 1 | 1 | ★★★★★ | Cruising, racing |
| Cutter | 1 | 2 | ★★★★☆ | Offshore, heavy weather |
| Ketch | 2 | 1-2 | ★★★☆☆ | Cruising, liveaboard |
| Yawl | 2 | 1-2 | ★★★☆☆ | Classic sailing |
| Schooner | 2+ | 2+ | ★★☆☆☆ | Large yachts |

## Find Your Perfect Rig

Use our [Yacht Finder](/yachts/finder) to discover yachts with the right rig type for your sailing plans, or [compare rig types](/compare) side by side.

---

*Learn more sailing terms in our [Glossary](/glossary) — covering everything from rig types to hull shapes.*`
  },
  {
    slug: 'how-to-buy-a-used-sailboat',
    title: 'How to Buy a Used Sailboat: Complete Checklist & Guide',
    excerpt: 'Step-by-step guide to buying a pre-owned sailboat. Covers survey, valuation, common issues, negotiation tips, and how to use data to assess fair market value.',
    category: 'buying-guide',
    reading_time_minutes: 11,
    md: `# How to Buy a Used Sailboat: Complete Checklist

Buying a used sailboat can be one of the best-value decisions in sailing — but it carries risks. This guide walks you through every step, from initial research to closing the deal, with practical tips and data-driven insights.

## Step 1: Define Your Needs

Before browsing listings, answer these questions:

- **Where will you sail?** (Coastal, offshore, lake, Mediterranean?)
- **How many people?** (Solo, couple, family, crew?)
- **What's your budget?** (Include mooring, insurance, maintenance — typically 10% of purchase price annually)
- **What's your experience level?** (Be honest about handling capability)

Use our [Yacht Finder](/yachts/finder) to get personalized recommendations based on your needs.

## Step 2: Research Models

Use specification data to narrow your search:

- **LOA**: Overall length affects marina costs and handling
- **Draft**: Determines which waters you can access
- **Displacement**: Heavier boats are more stable but slower
- **Cabins & Berths**: Match to your crew size
- **Ballast Ratio**: Higher = more stable (aim for 30%+)

[Browse yacht specifications →](/yachts)

## Step 3: Survey & Inspection

### Must-Check Items
1. **Hull**: Osmosis blistering, gelcoat cracks, grounding damage
2. **Keel**: Keel bolt condition, keel-hull joint, rust
3. **Rigging**: Standing rigging age (replace every 10-15 years), chainplates
4. **Engine**: Hours, service history, oil analysis
5. **Sails**: Age, condition, UV damage
6. **Deck**: Core moisture, stanchion bases, chainplate leaks
7. **Electronics**: GPS, chartplotter, AIS, VHF, autopilot
8. **Plumbing**: Through-hulls, seacocks, bilge pumps

### Hire a Professional Surveyor
Always get an independent marine survey. Budget €500-1,500 depending on boat size and location.

## Step 4: Valuation

Compare asking prices against specification data:

- Check the [ballast ratio](/glossary/ballast-ratio) and [displacement](/glossary/displacement) to understand the design's intent
- Compare against similar models using our [comparison tool](/compare)
- Factor in age, equipment, and refit history

## Step 5: Negotiation Tips

- Start 15-20% below asking price for a realistic starting point
- Use survey findings as leverage
- Budget 10-15% of purchase price for immediate repairs/upgrades
- Be prepared to walk away — there are always other boats

## Common Red Flags

- Fresh bottom paint covering blisters
- New rigging without a documented reason
- Engine hours inconsistent with boat age
- Missing maintenance records
- Deck softness around fittings

## After the Purchase

1. **Insurance**: Get comprehensive coverage before taking delivery
2. **Registration**: Transfer or register in your flag state
3. **Safety equipment**: Life raft, EPIRB, flares, PFDs, fire extinguishers
4. **Sea trial**: If not done before purchase, schedule immediately

---

*Use our database of [243 yacht models](/yachts) to research specifications before you buy.*`
  },
  {
    slug: 'sailboat-specifications-decoded-loa-beam-draft-displacement',
    title: 'Sailboat Specifications Decoded: LOA, Beam, Draft & Displacement',
    excerpt: 'What do LOA, beam, draft, and displacement really mean? Learn how to read sailboat specifications and use them to compare yachts effectively.',
    category: 'educational',
    reading_time_minutes: 10,
    md: `# Sailboat Specifications Decoded

When browsing yacht listings, you'll encounter dozens of specifications. This guide explains what each spec means, why it matters, and how to use them when comparing yachts.

## The Big Four Dimensions

### LOA (Length Overall)
The total length of the hull from bow to stern, excluding fittings like pulpits.

**Why it matters**: LOA determines marina fees (often charged per meter), harbor accessibility, and general size perception.

[Learn more in our glossary →](/glossary/loa)

### Beam
The widest point of the hull, measured at the widest cross-section.

**Why it matters**: Beam affects interior volume, stability, and initial righting moment. Wider boats have more interior space but may be less comfortable in rough seas.

[Learn more in our glossary →](/glossary/beam)

### Draft
The vertical distance from the waterline to the lowest point of the keel.

**Why it matters**: Draft determines which waters you can navigate. A 2m draft excludes you from many Mediterranean anchorages and shallow coastal areas.

[Learn more in our glossary →](/glossary/draft)

### Displacement
The total weight of water displaced by the hull — effectively, the weight of the boat.

**Why it matters**: Heavier boats tend to be more stable and comfortable but slower. Light boats are faster but can be less comfortable offshore.

[Learn more in our glossary →](/glossary/displacement)

## Performance Ratios

### Ballast Ratio
Ballast weight ÷ displacement × 100. Higher = more stability.

**Good ranges**: 30-35% (cruising), 35-45% (performance)

[Learn more →](/glossary/ballast-ratio)

### Displacement-Length Ratio (D/L)
Indicates whether a boat is "heavy" or "light" for its length.

- Below 200: Light displacement (fast, less comfortable)
- 200-300: Moderate displacement (good all-around)
- Above 300: Heavy displacement (comfortable, seaworthy)

### Sail Area-Displacement Ratio (SA/D)
Indicates sail power relative to weight.

- Below 15: Under-canvassed (motor-sailer territory)
- 15-18: Moderate (cruiser)
- Above 18: Well-canvassed (performance)

## Using Specs to Compare Yachts

Our [comparison tool](/compare) lets you put two yachts side by side with all specifications visible at once. Try comparing:

- [Oceanis 40.1 vs Sun Odyssey 410](/compare/beneteau-oceanis-40-1-vs-jeanneau-sun-odyssey-410) — two popular 40-foot cruisers

## Practical Application

When comparing yachts, don't look at specs in isolation. A 40-footer with a 2.1m draft might be perfect for Atlantic crossings but useless for Bahamas cruising. Always match specs to your intended use.

[Browse all yacht specifications →](/yachts)

---

*All specification data sourced from our database of 243 models across 42 manufacturers.*`
  },
  {
    slug: 'bluewater-sailboat-checklist-essentials',
    title: 'Bluewater Sailboat Checklist: What You Need for Ocean Passages',
    excerpt: 'Essential checklist for preparing a sailboat for bluewater ocean passages. Covers hull construction, rig strength, safety equipment, and which production yachts are ocean-ready.',
    category: 'ownership',
    reading_time_minutes: 12,
    md: `# Bluewater Sailboat Checklist: What You Need for Ocean Passages

Crossing an ocean in a sailboat is one of life's great adventures — but it requires a yacht that's up to the task. This checklist covers everything you need to consider before casting off for bluewater.

## What Makes a Yacht "Bluewater Capable"?

### Hull Construction
- **Solid fiberglass** below the waterline (no cored hulls in impact zones)
- **Strong hull-deck joint** (bolted through, not just bonded)
- **Robust keel attachment** with substantial backing plates

### Keel & Rudder
- **Deep fin keel** or full keel for tracking and stability
- **Ballast ratio above 30%** for positive righting moment
- **Spade rudder** with emergency tiller capability (or full keel with protected rudder)

[Browse bluewater-capable yachts →](/yachts?filters%5BlengthMin%5D=12)

### Rig & Sails
- **Heavy-duty standing rigging** (oversized for safety margin)
- **Storm sails**: Trysail, heavy-air jib (storm jib)
- **Reefing system**: At least 3 reef points in the mainsail
- **Spare rigging** and emergency repair kit

## Safety Equipment (Non-Negotiable)

### Lifesaving
- Life raft (certified, recently serviced)
- EPIRB (406 MHz, registered)
- Personal AIS MOB beacons for each crew member
- PFDs with harness and tether (one per crew)
- Danbuoy and horseshoe buoy
- Flares (in-date) or electronic visual distress signals

### Navigation & Communication
- Chartplotter with backup paper charts
- AIS transceiver (not just receiver)
- VHF radio with DSC and backup handheld
- Satellite communicator (Garmin inReach, Iridium)
- Autopilot with wind vane as backup

### Emergency Preparedness
- Ditch bag (grab bag) with documents, cash, EPIRB
- Fire extinguishers (minimum 3)
- Bilge pumps: manual + electric (high capacity)
- Wooden bungs for all through-hulls
- Comprehensive first aid kit + medical guide
- Jacklines running fore and aft

## Production Yachts Suitable for Bluewater

Many modern production yachts can handle ocean passages with proper preparation:

- **Beneteau Oceanis 40.1+**: Solid construction, proven track record
- **Jeanneau Sun Odyssey 410+**: Good stability, comfortable passage-maker
- **Hanse 415+**: Self-tacking jib options, strong build quality
- **Hallberg-Rassy**: Purpose-built for offshore cruising
- **Amel**: Legendary bluewater reputation

[Compare these yachts →](/compare)

## Preparation Timeline

| Months Before | Tasks |
|--------------|-------|
| 12 | Hull survey, rig inspection, major refits |
| 6 | Safety equipment check/replace, sail inventory |
| 3 | Provisioning plan, crew training, route planning |
| 1 | Final safety drill, ditch bag packed, comms tested |
| 1 week | Weather window planning, final checks |
| Departure day | Float plan filed, final weather check |

---

*Explore our [Bluewater Glossary](/glossary/bluewater) for more offshore sailing terminology.*`
  },
];

async function main() {
  for (const guide of guides) {
    try {
      await sql`
        INSERT INTO articles (slug, title, excerpt, content, content_markdown, category, author, author_title, reading_time_minutes, is_published, published_at, created_at, updated_at)
        VALUES (${guide.slug}, ${guide.title}, ${guide.excerpt}, ${guide.md}, ${guide.md}, ${guide.category}, 'Sailing Yacht Info Editorial', 'Data-Driven Sailing Analysis', ${guide.reading_time_minutes}, true, NOW(), NOW(), NOW())
        ON CONFLICT (slug) DO UPDATE SET
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content = EXCLUDED.content,
          content_markdown = EXCLUDED.content_markdown,
          category = EXCLUDED.category,
          reading_time_minutes = EXCLUDED.reading_time_minutes,
          updated_at = NOW()
      `;
      console.log('✅ Inserted:', guide.title);
    } catch (e) {
      console.error('❌ Error:', guide.slug, e.message);
    }
  }

  const count = await sql`SELECT count(*) as c FROM articles WHERE is_published = true`;
  console.log('\nTotal published articles:', count[0].c);
}

main().catch(console.error);
