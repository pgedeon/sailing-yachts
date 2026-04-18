#!/usr/bin/env node
/**
 * Scrape manufacturer yacht images from their official websites.
 * Stores the manufacturer-hosted image URL (no downloading/copying).
 * 
 * Usage: node scripts/scrape-manufacturer-images.js [--dry-run] [--mfg "Beneteau"]
 */

const https = require('https');
const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DRY_RUN = process.argv.includes('--dry-run');
const MFG_FILTER = process.argv.includes('--mfg') ? process.argv[process.argv.indexOf('--mfg') + 1] : null;

// Manufacturer URL patterns - maps to their website model page URL
const MANUFACTURER_PATTERNS = {
  'Beneteau': {
    baseUrl: 'https://www.beneteau.com',
    // Map model names to URL slugs
    getSlug: (model) => {
      const slugMap = {
        'Oceanis 30.1': '/oceanis/oceanis-301',
        'Oceanis 34.1': '/oceanis/oceanis-341',
        'Oceanis 38.1': '/oceanis/oceanis-371',
        'Oceanis 40.1': '/oceanis/oceanis-401',
        'Oceanis 46.1': '/oceanis/oceanis-47',
        'Oceanis 51.1': '/oceanis/oceanis-52',
        'Oceanis Yacht 54': '/oceanis-yacht/oceanis-yacht-54',
        'Oceanis Yacht 62': '/oceanis-yacht/oceanis-yacht-60',
        'First 24': '/first/first-24',
        'First 27': '/first/first-27',
        'First 27 SE': '/first/first-27-se',
        'First 36': '/first/first-36',
        'First 44': '/first/first-44',
        'FIGARO Beneteau 3': '/figaro/figaro-beneteau-3',
      };
      return slugMap[model] || null;
    },
    extractImage: (html, model) => {
      // Look for header/hero image
      const match = html.match(/src="[^"]*\/styles\/article_main_desktop\/public\/([^"]+?)\.jpg\.webp[^"]*"/);
      if (match) {
        const file = match[1].replace(/-header$/, '-header');
        return `https://www.beneteau.com/sites/default/files/${file}.jpg`;
      }
      // Fallback: first exterior image
      const ext = html.match(/src="[^"]*\/styles\/standard_large\/public\/([^"]+?\.jpg)\.webp[^"]*"/);
      if (ext) return `https://www.beneteau.com/sites/default/files/${ext[1]}`;
      return null;
    }
  },
  'Jeanneau': {
    baseUrl: 'https://www.jeanneau.com',
    getSlug: (model) => {
      const slugMap = {
        'Sun Odyssey 349': '/en-us/boats/sailboat/2-sun-odyssey/84-sun-odyssey-349',
        'Sun Odyssey 350': '/en-us/boats/sailboat/2-sun-odyssey/737-sun-odyssey-350',
        'Sun Odyssey 380': '/en-us/boats/sailboat/2-sun-odyssey/709-sun-odyssey-380',
        'Sun Odyssey 410': '/en-us/boats/sailboat/2-sun-odyssey/629-sun-odyssey-410',
        'Sun Odyssey 440': '/en-us/boats/sailboat/2-sun-odyssey/661-sun-odyssey-440',
        'Sun Odyssey 490': '/en-us/boats/sailboat/2-sun-odyssey/682-sun-odyssey-490',
        'Sun Odyssey 320': '/en-us/boats/sailboat/2-sun-odyssey/749-sun-odyssey-320',
        'Sun Odyssey 495': '/en-us/boats/sailboat/2-sun-odyssey/749-sun-odyssey-495',
        'Sun Fast 3300': '/en-us/boats/sailboat/14-sun-fast/706-sun-fast-3300',
        'Jeanneau 53': '/en-us/boats/sailboat/2-sun-odyssey/595-jeanneau-53',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      // Jeanneau stores exterior HD images
      const match = html.match(/(https:\/\/app\.jeanneau\.com\/uploads\/media\/image\/exterior\/hd\/[^"'\s<>]+\.jpg)/);
      if (match) return match[1];
      // Fallback: any boat image
      const fallback = html.match(/(https:\/\/app\.jeanneau\.com\/uploads\/boat\/image\/[^"'\s<>]+\.jpg)/);
      return fallback ? fallback[1] : null;
    }
  },
  'Bavaria Yachts': {
    baseUrl: 'https://www.bavariayachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Cruiser 34': '/en/sailing-yachts/cruiser-34/',
        'Cruiser 37': '/en/sailing-yachts/cruiser-37/',
        'Cruiser 40': '/en/sailing-yachts/cruiser-40/',
        'Cruiser 46': '/en/sailing-yachts/cruiser-46/',
        'Cruiser 51': '/en/sailing-yachts/cruiser-51/',
        'C42': '/en/sailing-yachts/c42/',
        'R40': '/en/sailing-yachts/r40/',
        'VR6': '/en/sailing-yachts/vr6/',
        'Vision 42': '/en/sailing-yachts/vision-42/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      // Look for hero/gallery images
      const match = html.match(/(?:src|data-src)="([^"]*(?:hero|gallery|header|teaser|overview)[^"]*\.(?:jpg|jpeg|webp|png))"/i);
      if (match) return match[1].startsWith('http') ? match[1] : `https://www.bavariayachts.com${match[1]}`;
      // Fallback: og:image
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Hanse Yachts': {
    baseUrl: 'https://www.hanseyachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Hanse 315': '/en/hanse-315',
        'Hanse 348': '/en/hanse-348',
        'Hanse 388': '/en/hanse-388',
        'Hanse 415': '/en/hanse-415',
        'Hanse 458': '/en/hanse-458',
        'Hanse 460': '/en/hanse-460',
        'Hanse 548': '/en/hanse-548',
        'Hanse 588': '/en/hanse-588',
        'Hanse 675': '/en/hanse-675',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Dufour Yachts': {
    baseUrl: 'https://www.dufour-yachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Dufour 320': '/en/dufour-320/',
        'Dufour 37': '/en/dufour-37/',
        'Dufour 41': '/en/dufour-41/',
        'Dufour 470': '/en/dufour-470/',
        'Dufour 530': '/en/dufour-530/',
        'Dufour 56': '/en/dufour-56/',
        'Dufour 390 Grand Large': '/en/dufour-390-grand-large/',
        'Dufour 430 Grand Large': '/en/dufour-430-grand-large/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Lagoon': {
    baseUrl: 'https://www.lagoon-catamarans.com',
    getSlug: (model) => {
      const slugMap = {
        'Lagoon 38': '/en/catamarans-lagoon/sailing-catamaran/lagoon-38',
        'Lagoon 40': '/en/catamarans-lagoon/sailing-catamaran/lagoon-40',
        'Lagoon 42': '/en/catamarans-lagoon/sailing-catamaran/lagoon-42',
        'Lagoon 46': '/en/catamarans-lagoon/sailing-catamaran/lagoon-46',
        'Lagoon 51': '/en/catamarans-lagoon/sailing-catamaran/lagoon-51',
        'Lagoon 55': '/en/catamarans-lagoon/sailing-catamaran/lagoon-55',
        'Lagoon 450 F': '/en/catamarans-lagoon/sailing-catamaran/lagoon-450',
        'Lagoon Sixty 5': '/en/catamarans-lagoon/sailing-catamaran/lagoon-sixty-5',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Catalina Yachts': {
    baseUrl: 'https://www.catalinayachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Catalina 14.2': '/14-2',
        'Catalina 22 Sport': '/22sport',
        'Catalina 275 Sport': '/275',
        'Catalina 315': '/315',
        'Catalina 355': '/355',
        'Catalina 375': '/375',
        'Catalina 425': '/425',
        'Catalina 445': '/445',
        'Catalina 545': '/545',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      if (og) return og[1];
      const match = html.match(/src="(\/[^"]*\.(?:jpg|jpeg|png|webp))"/);
      return match ? `https://www.catalinayachts.com${match[1]}` : null;
    }
  },
  'Hallberg-Rassy': {
    baseUrl: 'https://www.hallberg-rassy.com',
    getSlug: (model) => {
      const slugMap = {
        'Hallberg-Rassy 340': '/models/hr340/',
        'Hallberg-Rassy 40C': '/models/hr40c/',
        'Hallberg-Rassy 44': '/models/hr44/',
        'Hallberg-Rassy 48': '/models/hr48/',
        'Hallberg-Rassy 57': '/models/hr57/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      if (og) return og[1];
      const match = html.match(/src="([^"]*(?:photo|gallery|exterior)[^"]*\.(?:jpg|jpeg|png))"/i);
      return match ? (match[1].startsWith('http') ? match[1] : `https://www.hallberg-rassy.com${match[1]}`) : null;
    }
  },
  'Elan Yachts': {
    baseUrl: 'https://www.elan-yachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Elan E1': '/en/e1/',
        'Elan E3': '/en/e3/',
        'Elan E4': '/en/e4/',
        'Elan E5': '/en/e5/',
        'Elan E6': '/en/e6/',
        'Elan GT5': '/en/gt5/',
        'Elan Impression 45.1': '/en/impression-45-1/',
        'Elan Impression 50.1': '/en/impression-50-1/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Oyster Yachts': {
    baseUrl: 'https://www.oysteryachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Oyster 475': '/yachts/oyster-475/',
        'Oyster 495': '/yachts/oyster-495/',
        'Oyster 565': '/yachts/oyster-565/',
        'Oyster 595': '/yachts/oyster-595/',
        'Oyster 745': '/yachts/oyster-745/',
        'Oyster 885': '/yachts/oyster-885/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'X-Yachts': {
    baseUrl: 'https://www.x-yachts.com',
    getSlug: (model) => {
      const slugMap = {
        'X35': '/yachts/x/yacht/x35/',
        'X41': '/yachts/x/yacht/x41/',
        'X4³': '/yachts/x/yacht/x4-3/',
        'X5⁶': '/yachts/x/yacht/x5-6/',
        'Xc 45': '/yachts/xc/yacht/xc-45/',
        'Xc 50': '/yachts/xc/yacht/xc-50/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Swan (Nautor)': {
    baseUrl: 'https://www.nautor.com',
    getSlug: (model) => {
      const slugMap = {
        'Swan 38': '/swan/swan-38/',
        'Swan 43': '/swan/swan-43/',
        'Swan 48': '/swan/swan-48/',
        'Swan 55': '/swan/swan-55/',
        'Swan 65': '/swan/swan-65/',
        'Swan 78': '/swan/swan-78/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Dehler': {
    baseUrl: 'https://www.dehler.com',
    getSlug: (model) => {
      const slugMap = {
        'Dehler 30 OD': '/en/dehler-30-od',
        'Dehler 32': '/en/dehler-32',
        'Dehler 34': '/en/dehler-34',
        'Dehler 38': '/en/dehler-38',
        'Dehler 38 SQ': '/en/dehler-38-sq',
        'Dehler 42': '/en/dehler-42',
        'Dehler 46': '/en/dehler-46',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
  'Moody Yachts': {
    baseUrl: 'https://www.moodyyachts.com',
    getSlug: (model) => {
      const slugMap = {
        'Moody 41': '/en/moody-41/',
        'Moody 41 AC': '/en/moody-41-ac/',
        'Moody 45': '/en/moody-45/',
        'Moody DS45': '/en/moody-ds45/',
        'Moody DS54': '/en/moody-ds54/',
      };
      return slugMap[model] || null;
    },
    extractImage: (html) => {
      const og = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/);
      return og ? og[1] : null;
    }
  },
};

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      timeout: 15000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchPage(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  const result = await pool.query(
    "SELECT y.id, y.model_name, m.name as mfg FROM yacht_models y JOIN manufacturers m ON y.manufacturer_id = m.id ORDER BY m.name, y.model_name"
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const model of result.rows) {
    const { id, model_name, mfg } = model;
    
    if (MFG_FILTER && mfg !== MFG_FILTER) continue;

    const pattern = MANUFACTURER_PATTERNS[mfg];
    if (!pattern) {
      skipped++;
      continue;
    }

    const slug = pattern.getSlug(model_name);
    if (!slug) {
      console.log(`  SKIP ${mfg} ${model_name} (no URL mapping)`);
      skipped++;
      continue;
    }

    const url = pattern.baseUrl + slug;
    console.log(`  ${mfg} ${model_name} → ${url}`);

    try {
      const html = await fetchPage(url);
      const imageUrl = pattern.extractImage(html, model_name);
      
      if (!imageUrl) {
        console.log(`    ❌ No image found on page`);
        failed++;
        continue;
      }

      console.log(`    ✅ ${imageUrl}`);
      
      if (!DRY_RUN) {
        // Update existing image or insert new one
        await pool.query(
          "UPDATE images SET url = $1, alt_text = $2 WHERE yacht_model_id = $3 AND is_primary = true",
          [imageUrl, `${mfg} ${model_name}`, id]
        );
        // Check if update affected any rows
        const check = await pool.query(
          "SELECT id FROM images WHERE yacht_model_id = $1 AND is_primary = true",
          [id]
        );
        if (check.rows.length === 0) {
          await pool.query(
            "INSERT INTO images (yacht_model_id, url, alt_text, is_primary, sort_order, created_at) VALUES ($1, $2, $3, true, 0, NOW())",
            [id, imageUrl, `${mfg} ${model_name}`]
          );
        }
      }
      
      updated++;
    } catch (err) {
      console.log(`    ❌ Error: ${err.message}`);
      failed++;
    }

    // Small delay to be polite
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped (no pattern), ${failed} failed`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
