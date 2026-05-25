/**
 * Seed manufacturer spotlights for top brands missing them
 */
require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const spotlights = [
  {
    name: 'Dufour Yachts',
    title: 'Dufour Yachts: French Performance Cruising with Mediterranean Soul',
    meta_description: 'Explore Dufour Yachts — French sailboat manufacturer known for performance cruisers. Discover their heritage from 1964 to today.',
    history_markdown: 'Founded in 1964 by Michel Dufour in La Rochelle, France, Dufour Yachts began with the legendary Sylphe — one of the first production fiberglass sailboats. Dufour quickly gained a reputation for combining performance with comfort. The La Rochelle factory produces yachts from 32 to 56 feet, designed by Umberto Felci for sailors who want both speed and comfort. The Grand Large series and Performance line serve different sailing styles.',
    brand_positioning: 'Performance cruiser',
    notable_models: [{reason: 'Popular performance cruiser with excellent handling', yachtSlug: 'dufour-382'}, {reason: 'Best-selling mid-size cruiser in the Dufour range', yachtSlug: 'dufour-412'}, {reason: 'Flagship performance cruiser with innovative deck layout', yachtSlug: 'dufour-530'}],
    milestones: [{year: 1964, event: 'Michel Dufour founds the company in La Rochelle'}, {year: 1975, event: '5,000th boat launched'}, {year: 2010, event: 'Grand Large series debut'}, {year: 2020, event: 'Dufour 390 wins Boat of the Year'}],
  },
  {
    name: 'Oyster Yachts',
    title: 'Oyster Yachts: British Bluewater Luxury for Global Adventurers',
    meta_description: 'Discover Oyster Yachts — British luxury bluewater sailboat builder. Explore their world-renowned ocean-cruising pedigree.',
    history_markdown: 'Oyster Yachts has been building world-class bluewater cruising yachts since 1973. Based in the UK, Oyster is synonymous with luxury ocean sailing, having equipped hundreds of owners for circumnavigations and transoceanic passages. Oyster yachts are built for owners who demand comfort, safety, and performance on ocean passages, with handcrafted interiors and robust construction.',
    brand_positioning: 'Luxury bluewater cruiser',
    notable_models: [{reason: 'Entry-level luxury bluewater cruiser', yachtSlug: 'oyster-495'}, {reason: 'Flagship luxury cruiser for circumnavigation', yachtSlug: 'oyster-885'}],
    milestones: [{year: 1973, event: 'Richard Askham founds Oyster Marine'}, {year: 1998, event: 'Oyster Regatta becomes premier bluewater event'}, {year: 2018, event: 'New ownership under Richard Hadida'}, {year: 2022, event: 'Oyster 495 launches to critical acclaim'}],
  },
  {
    name: 'Elan Yachts',
    title: 'Elan Yachts: Slovenian Performance Innovation with Rob Humphreys Design',
    meta_description: 'Explore Elan Yachts — Slovenian performance sailboat builder with innovative designs by Rob Humphreys.',
    history_markdown: 'Founded in 1949 in Slovenia, Elan began as a sports equipment manufacturer before entering sailboat production. Today, Elan is known for innovative performance designs created in collaboration with renowned designer Rob Humphreys. The factory in Begunje produces yachts from 31 to 50 feet with a three-line strategy: Performance (E-series), Grand Tourisme (GT), and Impression (cruising).',
    brand_positioning: 'Performance cruiser',
    notable_models: [{reason: 'Award-winning performance daysailer', yachtSlug: 'elan-e3'}, {reason: 'Performance cruiser with dual-rudder design', yachtSlug: 'elan-e4'}, {reason: 'Grand Tourisme performance cruiser', yachtSlug: 'elan-gt5'}],
    milestones: [{year: 1949, event: 'Elan founded in Begunje, Slovenia'}, {year: 2008, event: 'Elan 340 wins European Yacht of the Year'}, {year: 2018, event: 'Elan E4 debut'}, {year: 2022, event: 'Elan GT5 launch'}],
  },
  {
    name: 'Swan (Nautor)',
    title: 'Nautor Swan: Finnish Craftsmanship — The Ultimate Sailing Yacht',
    meta_description: 'Discover Nantor Swan — Finnish luxury sailboat builder since 1966. The gold standard of sailing yachts.',
    history_markdown: "Founded in 1966 in Pietarsaari, Finland, Nautor Swan has built some of the world's most coveted sailing yachts. Designed initially by Sparkman & Stephens and later by German Frers and Juan Kouyoumdjian, Swans are the benchmark for quality, performance, and elegance. With over 2,400 yachts built, Swan represents the pinnacle of Finnish boat-building craftsmanship.",
    brand_positioning: 'Luxury performance',
    notable_models: [{reason: 'Classic performance cruiser', yachtSlug: 'nautor-swan-48'}, {reason: 'Luxury bluewater cruiser', yachtSlug: 'nautor-swan-55'}],
    milestones: [{year: 1966, event: 'Pekka Koskenkyla founds Nautor; Swan 36 designed by S&S'}, {year: 1971, event: 'Swan 48 wins Sydney-Hobart'}, {year: 2005, event: 'ClubSwan 42 launch'}, {year: 2020, event: 'Swan 58 debut'}],
  },
  {
    name: 'Dehler',
    title: 'Dehler Yachts: German Performance Sailing with Racing DNA',
    meta_description: 'Discover Dehler Yachts — German performance sailboat brand with deep racing heritage.',
    history_markdown: 'Founded in 1970 by Willy Dehler in Germany, Dehler has always been about performance sailing. From the iconic Sprinta to the modern Dehler 46, the brand combines German engineering with genuine racing pedigree. Modern Dehler yachts, designed by Judel/Vrolijk, offer race-winning performance with genuine cruising comfort — the ultimate dual-purpose yachts.',
    brand_positioning: 'Performance racer-cruiser',
    notable_models: [{reason: 'Affordable performance racer', yachtSlug: 'dehler-30'}, {reason: 'European Yacht of the Year 2018', yachtSlug: 'dehler-38'}, {reason: 'Flagship performance cruiser-racer', yachtSlug: 'dehler-46'}],
    milestones: [{year: 1970, event: 'Willy Dehler builds first boat'}, {year: 1979, event: 'Sprinta becomes one-design racing class'}, {year: 2009, event: 'Hanse Group acquires Dehler'}, {year: 2018, event: 'Dehler 38 wins European Yacht of the Year'}],
  },
  {
    name: 'Amel',
    title: 'Amel Yachts: The French Bluewater Legend Built for Ocean Wanderers',
    meta_description: 'Explore Amel Yachts — French luxury bluewater sailboat manufacturer, purpose-built for ocean cruising.',
    history_markdown: 'Founded in 1949 by Henri Amel in La Rochelle, France, Amel has built some of the most respected bluewater cruising yachts in history. Every Amel is designed for long-distance ocean sailing with exceptional comfort and reliability. Amel yachts are purpose-built for ocean crossing — with ketch rigs, protected center cockpits, and systems designed for autonomous living at sea.',
    brand_positioning: 'Luxury bluewater cruiser',
    notable_models: [{reason: 'Modern bluewater cruiser for couples', yachtSlug: 'amel-50'}, {reason: 'Legendary ocean cruiser', yachtSlug: 'amel-54'}],
    milestones: [{year: 1949, event: 'Henri Amel founds the shipyard in La Rochelle'}, {year: 1988, event: 'Super Maramu debut — iconic bluewater yacht'}, {year: 2005, event: 'Amel 54 launch'}, {year: 2020, event: 'Amel 50 introduction'}],
  },
  {
    name: 'J/Boats',
    title: 'J/Boats: American One-Design Excellence — From J/22 to J/121',
    meta_description: 'Discover J/Boats — American performance sailboat brand with world-dominant one-design classes.',
    history_markdown: "Founded in 1977 by brothers Rod and Bob Johnstone in Connecticut, J/Boats revolutionized sailing with one-design performance sailboats. The J/24 became the world's most popular keelboat with over 5,500 built. With over 14,000 boats built across 40+ models, J/Boats has defined performance one-design sailing for nearly 50 years.",
    brand_positioning: 'Performance one-design',
    notable_models: [{reason: 'Fastest-growing one-design class worldwide', yachtSlug: 'j-boats-j70'}, {reason: 'Performance shorthanded offshore racer', yachtSlug: 'j-boats-j99'}],
    milestones: [{year: 1977, event: 'J/24 designed in the Johnstone family garage'}, {year: 1981, event: 'J/24 reaches 1,000 hulls'}, {year: 2012, event: 'J/70 debut'}, {year: 2019, event: 'J/99 launch'}],
  },
  {
    name: 'Wauquiez',
    title: 'Wauquiez Yachts: French Offshore Excellence Since 1965',
    meta_description: 'Explore Wauquiez Yachts — French performance offshore cruiser manufacturer.',
    history_markdown: 'Founded in 1965 by Henri Wauquiez in northern France, Wauquiez has built a reputation for robust offshore-capable yachts that blend performance with seaworthiness. The Centurion range is particularly respected among serious cruisers. Wauquiez yachts are known for solid construction, thoughtful layouts, and offshore capability.',
    brand_positioning: 'Performance offshore cruiser',
    notable_models: [{reason: 'Classic performance cruiser', yachtSlug: 'wauquiez-centurion-40s'}, {reason: 'Raised-saloon offshore cruiser', yachtSlug: 'wauquiez-pilot-saloon-42'}],
    milestones: [{year: 1965, event: 'Henri Wauquiez begins boatbuilding'}, {year: 1976, event: 'Centurion 32 debut'}, {year: 2010, event: 'Pilot Saloon concept introduced'}, {year: 2020, event: 'Centurion 57 launch'}],
  },
];

async function main() {
  for (const sp of spotlights) {
    try {
      const manu = await sql`SELECT id FROM manufacturers WHERE name = ${sp.name}`;
      if (manu.length === 0) {
        console.log('⚠️  Not found:', sp.name);
        continue;
      }
      const manuId = manu[0].id;
      const slug = sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      const notableJson = JSON.stringify(sp.notable_models);
      const milestonesJson = JSON.stringify(sp.milestones);

      await sql`
        INSERT INTO manufacturer_spotlights (manufacturer_id, slug, title, meta_description, history_markdown, brand_positioning, notable_models, milestones, is_published, published_at, created_at, updated_at)
        VALUES (${manuId}, ${slug}, ${sp.title}, ${sp.meta_description}, ${sp.history_markdown}, ${sp.brand_positioning}, ${notableJson}::jsonb, ${milestonesJson}::jsonb, true, NOW(), NOW(), NOW())
        ON CONFLICT (manufacturer_id) DO UPDATE SET
          title = EXCLUDED.title,
          meta_description = EXCLUDED.meta_description,
          history_markdown = EXCLUDED.history_markdown,
          brand_positioning = EXCLUDED.brand_positioning,
          notable_models = EXCLUDED.notable_models,
          milestones = EXCLUDED.milestones,
          updated_at = NOW()
      `;
      console.log('✅', sp.name);
    } catch (e) {
      console.error('❌', sp.name, e.message);
    }
  }
  const count = await sql`SELECT count(*) as c FROM manufacturer_spotlights WHERE is_published = true`;
  console.log('\nTotal spotlights:', count[0].c);
}

main().catch(console.error);
