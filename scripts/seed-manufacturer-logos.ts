/**
 * P16.2 — Seed manufacturer logo URLs
 *
 * Uses Clearbit Logo API for most manufacturers, with manual overrides
 * for brands where Clearbit returns poor results or the website domain
 * doesn't match the brand name well.
 *
 * Run: npx tsx scripts/seed-manufacturer-logos.ts
 */

import { Pool } from "pg";

// Build logo URL mapping: manufacturer name -> logo URL
// Clearbit format: https://logo.clearbit.com/{domain}
const LOGO_OVERRIDES: Record<string, string> = {
  // Manual overrides where Clearbit domain doesn't work well
  "Allures Yachting": "https://logo.clearbit.com/allures-yachting.com",
  "Amel": "https://logo.clearbit.com/amel.fr",
  "Arcona Yachts": "https://logo.clearbit.com/arconayachts.se",
  "Bavaria Yachts": "https://logo.clearbit.com/bavariayachts.com",
  "Beneteau": "https://logo.clearbit.com/beneteau.com",
  "Bowman Yachts": "https://logo.clearbit.com/bowmanyachts.com",
  "CNB": "https://logo.clearbit.com/cnb.fr",
  "Catalina Yachts": "https://logo.clearbit.com/catalinayachts.com",
  "Contest Yachts": "https://logo.clearbit.com/contestyachts.com",
  "Dehler": "https://logo.clearbit.com/dehler.com",
  "Delphia Yachts": "https://logo.clearbit.com/delphiayachts.pl",
  "Dragonfly Trimarans": "https://logo.clearbit.com/dkboats.com",
  "Dufour Yachts": "https://logo.clearbit.com/dufour-yachts.com",
  "Elan Yachts": "https://logo.clearbit.com/elan-yachts.com",
  "Feeling": "https://logo.clearbit.com/feeling-yachts.com",
  "Garcia Yachting": "https://logo.clearbit.com/garcia-yachting.com",
  "Grand Soleil": "https://logo.clearbit.com/grandsoleil.net",
  "Hallberg-Rassy": "https://logo.clearbit.com/hallberg-rassy.com",
  "Hanse Yachts": "https://logo.clearbit.com/hanseyachts.com",
  "Hunter Yachts": "https://logo.clearbit.com/hunteryachts.com",
  "Island Packet": "https://logo.clearbit.com/islandpacket.com",
  "J/Boats": "https://logo.clearbit.com/jboats.com",
  "Jeanneau": "https://logo.clearbit.com/jeanneau.com",
  "Lagoon": "https://logo.clearbit.com/lagoon-catamarans.com",
  "Moody Yachts": "https://logo.clearbit.com/moody-yachts.com",
  "Mylius": "https://logo.clearbit.com/mylius.it",
  "Najad": "https://logo.clearbit.com/najad.com",
  "Neel Trimarans": "https://logo.clearbit.com/neel-trimarans.com",
  "Oyster Yachts": "https://logo.clearbit.com/oysteryachts.com",
  "RM Yachts": "https://logo.clearbit.com/rmyachts.fr",
  "Saffier Yachts": "https://logo.clearbit.com/saffieryachts.com",
  "Sirius Yachts": "https://logo.clearbit.com/sirius-yachts.com",
  "Solaris Yachts": "https://logo.clearbit.com/solarisyachts.it",
  "Sunbeam Yachts": "https://logo.clearbit.com/sunbeam-yachts.at",
  "Swan (Nautor)": "https://logo.clearbit.com/nautorgroup.com",
  "Tartan Yachts": "https://logo.clearbit.com/tartanyachts.com",
  "Wally": "https://logo.clearbit.com/wally.com",
  "Wauquiez": "https://logo.clearbit.com/wauquiez.com",
  "X-Yachts": "https://logo.clearbit.com/x-yachts.com",
  // These manufacturers have no website; leave logo_url null (fallback will handle)
  "Hatteland": null as any,
  "SaBoat (Grand Soleil)": "https://logo.clearbit.com/grandsoleil.net",
  "Vancouver (Northshore)": null as any,
};

function getLogoUrl(name: string, websiteUrl: string | null): string | null {
  if (LOGO_OVERRIDES[name] !== undefined) {
    return LOGO_OVERRIDES[name];
  }
  // Fallback: derive from website URL
  if (websiteUrl) {
    try {
      const domain = new URL(websiteUrl).hostname;
      return `https://logo.clearbit.com/${domain}`;
    } catch {
      return null;
    }
  }
  return null;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const client = await pool.connect();

  try {
    // Get all manufacturers
    const manufacturers = await client.query(
      "SELECT id, name, website_url, logo_url FROM manufacturers ORDER BY name"
    );

    console.log(`Found ${manufacturers.rows.length} manufacturers`);

    let updated = 0;
    let skipped = 0;
    let cleared = 0;

    for (const m of manufacturers.rows) {
      const logoUrl = getLogoUrl(m.name, m.website_url);

      if (logoUrl) {
        await client.query(
          "UPDATE manufacturers SET logo_url = $1 WHERE id = $2",
          [logoUrl, m.id]
        );
        console.log(`  ✅ ${m.name}: ${logoUrl}`);
        updated++;
      } else if (m.logo_url) {
        // Has existing logo but we can't determine one — keep it
        console.log(`  ⏭️  ${m.name}: keeping existing ${m.logo_url}`);
        skipped++;
      } else {
        console.log(`  ⬜ ${m.name}: no logo available (will use fallback)`);
        cleared++;
      }
    }

    console.log(`\nDone: ${updated} updated, ${skipped} kept, ${cleared} without logo`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
