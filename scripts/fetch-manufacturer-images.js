#!/usr/bin/env node
/**
 * Fetch manufacturer-hosted yacht images using Playwright.
 * Visits each manufacturer's model page in a headless browser,
 * extracts the primary/hero image URL, and updates the database.
 *
 * Usage:
 *   node scripts/fetch-manufacturer-images.js                  # All manufacturers
 *   node scripts/fetch-manufacturer-images.js --mfg "Beneteau" # Single manufacturer
 *   node scripts/fetch-manufacturer-images.js --dry-run        # Don't update DB
 *   node scripts/fetch-manufacturer-images.js --list           # Just list what would be scraped
 */

require('dotenv').config();
const { chromium } = require('playwright');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const DRY_RUN = process.argv.includes('--dry-run');
const LIST_ONLY = process.argv.includes('--list');
const MFG_FILTER = process.argv.includes('--mfg') ? process.argv[process.argv.indexOf('--mfg') + 1] : null;

// ============================================================
// MANUFACTURER URL REGISTRY
// Each entry: [model_name_matcher, url_function]
// url_function takes model_name and returns the page URL or null
// ============================================================

const MANUFACTURER_URLS = {
  'Beneteau': {
    baseUrl: 'https://www.beneteau.com',
    getUrl: (name) => {
      const map = {
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
      return map[name] ? 'https://www.beneteau.com' + map[name] : null;
    },
    extractImage: async (page) => {
      // Beneteau hero image is the largest img on the page
      return await page.evaluate(() => {
        const imgs = [...document.querySelectorAll('img')].filter(i =>
          i.src && i.naturalWidth > 800 && i.src.includes('sites/default/files')
          && !i.src.includes('icon') && !i.src.includes('logo') && !i.src.includes('thumb')
        );
        if (imgs.length === 0) return null;
        // Return the widest image
        imgs.sort((a, b) => b.naturalWidth - a.naturalWidth);
        return imgs[0].src;
      });
    }
  },

  'Jeanneau': {
    baseUrl: 'https://www.jeanneau.com',
    getUrl: (name) => {
      const map = {
        'Sun Odyssey 320': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/749-sun-odyssey-320',
        'Sun Odyssey 349': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/84-sun-odyssey-349',
        'Sun Odyssey 350': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/737-sun-odyssey-350',
        'Sun Odyssey 380': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/709-sun-odyssey-380',
        'Sun Odyssey 410': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/629-sun-odyssey-410',
        'Sun Odyssey 440': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/661-sun-odyssey-440',
        'Sun Odyssey 490': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/682-sun-odyssey-490',
        'Sun Odyssey 495': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/749-sun-odyssey-495',
        'Sun Fast 3300': 'https://www.jeanneau.com/boats/sailboat/14-sun-fast/706-sun-fast-3300',
        'Jeanneau 53': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/595-jeanneau-53',
        'Jeanneau 64': 'https://www.jeanneau.com/boats/sailboat/2-sun-odyssey/617-jeanneau-64',
      };
      return map[name] || null;
    },
    extractImage: async (page) => {
      return await page.evaluate(() => {
        // Jeanneau loads exterior images via data-src, also in gallery
        const extImgs = [...document.querySelectorAll('img[data-src]')]
          .map(i => i.dataset.src)
          .filter(s => s && s.includes('exterior'))
          .map(s => s.replace('/exterior/sd/', '/exterior/hd/'));
        if (extImgs.length > 0) return extImgs[0];
        // Fallback: any app.jeanneau.com boat image that's large
        const allImgs = [...document.querySelectorAll('img')].filter(i =>
          i.src && i.src.includes('app.jeanneau.com') && i.src.includes('/image/')
          && !i.src.includes('shape') && !i.src.includes('plan')
          && i.naturalWidth > 300
        );
        if (allImgs.length > 0) {
          allImgs.sort((a, b) => b.naturalWidth - a.naturalWidth);
          return allImgs[0].src;
        }
        return null;
      });
    }
  },

  'Bavaria Yachts': {
    baseUrl: 'https://www.bavariayachts.com',
    getUrl: (name) => {
      const map = {
        'Cruiser 34': 'https://www.bavariayachts.com/en/sailing-yachts/cruiser-34/',
        'Cruiser 37': 'https://www.bavariayachts.com/en/sailing-yachts/cruiser-37/',
        'Cruiser 40': 'https://www.bavariayachts.com/en/sailing-yachts/cruiser-40/',
        'Cruiser 46': 'https://www.bavariayachts.com/en/sailing-yachts/cruiser-46/',
        'Cruiser 51': 'https://www.bavariayachts.com/en/sailing-yachts/cruiser-51/',
        'C42': 'https://www.bavariayachts.com/en/sailing-yachts/c42/',
        'R40': 'https://www.bavariayachts.com/en/sailing-yachts/r40/',
        'Vision 42': 'https://www.bavariayachts.com/en/sailing-yachts/vision-42/',
        'C50': 'https://www.bavariayachts.com/en/sailing-yachts/c50/',
        'SR33': 'https://www.bavariayachts.com/en/sailing-yachts/sr33/',
      };
      return map[name] || null;
    },
    extractImage: async (page) => {
      // Try og:image first
      const og = await page.evaluate(() => {
        const el = document.querySelector('meta[property="og:image"]');
        return el ? el.content : null;
      });
      if (og && og.includes('http')) return og;
      // Fallback: largest image
      return await page.evaluate(() => {
        const imgs = [...document.querySelectorAll('img')].filter(i =>
          i.src && i.naturalWidth > 600 && !i.src.includes('icon') && !i.src.includes('logo')
        );
        if (imgs.length === 0) return null;
        imgs.sort((a, b) => b.naturalWidth - a.naturalWidth);
        return imgs[0].src;
      });
    }
  },

  'Hanse Yachts': {
    baseUrl: 'https://www.hanseyachts.com',
    getUrl: (name) => {
      const map = {
        'Hanse 315': 'https://www.hanseyachts.com/en/hanse-315',
        'Hanse 348': 'https://www.hanseyachts.com/en/hanse-348',
        'Hanse 388': 'https://www.hanseyachts.com/en/hanse-388',
        'Hanse 415': 'https://www.hanseyachts.com/en/hanse-415',
        'Hanse 458': 'https://www.hanseyachts.com/en/hanse-458',
        'Hanse 460': 'https://www.hanseyachts.com/en/hanse-460',
        'Hanse 548': 'https://www.hanseyachts.com/en/hanse-548',
        'Hanse 588': 'https://www.hanseyachts.com/en/hanse-588',
        'Hanse 675': 'https://www.hanseyachts.com/en/hanse-675',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Dufour Yachts': {
    baseUrl: 'https://www.dufour-yachts.com',
    getUrl: (name) => {
      const map = {
        'Dufour 320': 'https://www.dufour-yachts.com/en/dufour-320/',
        'Dufour 37': 'https://www.dufour-yachts.com/en/dufour-37/',
        'Dufour 41': 'https://www.dufour-yachts.com/en/dufour-41/',
        'Dufour 470': 'https://www.dufour-yachts.com/en/dufour-470/',
        'Dufour 530': 'https://www.dufour-yachts.com/en/dufour-530/',
        'Dufour 56': 'https://www.dufour-yachts.com/en/dufour-56/',
        'Dufour 390 Grand Large': 'https://www.dufour-yachts.com/en/dufour-390-grand-large/',
        'Dufour 430 Grand Large': 'https://www.dufour-yachts.com/en/dufour-430-grand-large/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Lagoon': {
    baseUrl: 'https://www.lagoon-catamarans.com',
    getUrl: (name) => {
      const map = {
        'Lagoon 38': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-38',
        'Lagoon 40': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-40',
        'Lagoon 42': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-42',
        'Lagoon 46': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-46',
        'Lagoon 51': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-51',
        'Lagoon 55': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-55',
        'Lagoon 450 F': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-450',
        'Lagoon Sixty 5': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-sixty-5',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Elan Yachts': {
    baseUrl: 'https://www.elan-yachts.com',
    getUrl: (name) => {
      const map = {
        'Elan E1': 'https://www.elan-yachts.com/en/e1/',
        'Elan E3': 'https://www.elan-yachts.com/en/e3/',
        'Elan E4': 'https://www.elan-yachts.com/en/e4/',
        'Elan E5': 'https://www.elan-yachts.com/en/e5/',
        'Elan E6': 'https://www.elan-yachts.com/en/e6/',
        'Elan GT5': 'https://www.elan-yachts.com/en/gt5/',
        'Elan Impression 45.1': 'https://www.elan-yachts.com/en/impression-45-1/',
        'Elan Impression 50.1': 'https://www.elan-yachts.com/en/impression-50-1/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Dehler': {
    baseUrl: 'https://www.dehler.com',
    getUrl: (name) => {
      const map = {
        'Dehler 30 OD': 'https://www.dehler.com/en/dehler-30-od',
        'Dehler 32': 'https://www.dehler.com/en/dehler-32',
        'Dehler 34': 'https://www.dehler.com/en/dehler-34',
        'Dehler 38': 'https://www.dehler.com/en/dehler-38',
        'Dehler 38 SQ': 'https://www.dehler.com/en/dehler-38-sq',
        'Dehler 42': 'https://www.dehler.com/en/dehler-42',
        'Dehler 46': 'https://www.dehler.com/en/dehler-46',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Hallberg-Rassy': {
    baseUrl: 'https://www.hallberg-rassy.com',
    getUrl: (name) => {
      const map = {
        'Hallberg-Rassy 340': 'https://www.hallberg-rassy.com/models/hr340/',
        'Hallberg-Rassy 40C': 'https://www.hallberg-rassy.com/models/hr40c/',
        'Hallberg-Rassy 44': 'https://www.hallberg-rassy.com/models/hr44/',
        'Hallberg-Rassy 48': 'https://www.hallberg-rassy.com/models/hr48/',
        'Hallberg-Rassy 57': 'https://www.hallberg-rassy.com/models/hr57/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'X-Yachts': {
    baseUrl: 'https://www.x-yachts.com',
    getUrl: (name) => {
      const map = {
        'X35': 'https://www.x-yachts.com/yachts/x/yacht/x35/',
        'X41': 'https://www.x-yachts.com/yachts/x/yacht/x41/',
        'X4³': 'https://www.x-yachts.com/yachts/x/yacht/x4-3/',
        'X5⁶': 'https://www.x-yachts.com/yachts/x/yacht/x5-6/',
        'Xc 45': 'https://www.x-yachts.com/yachts/xc/yacht/xc-45/',
        'Xc 50': 'https://www.x-yachts.com/yachts/xc/yacht/xc-50/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Oyster Yachts': {
    baseUrl: 'https://www.oysteryachts.com',
    getUrl: (name) => {
      const map = {
        'Oyster 475': 'https://www.oysteryachts.com/yachts/oyster-475/',
        'Oyster 495': 'https://www.oysteryachts.com/yachts/oyster-495/',
        'Oyster 565': 'https://www.oysteryachts.com/yachts/oyster-565/',
        'Oyster 595': 'https://www.oysteryachts.com/yachts/oyster-595/',
        'Oyster 745': 'https://www.oysteryachts.com/yachts/oyster-745/',
        'Oyster 885': 'https://www.oysteryachts.com/yachts/oyster-885/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Swan (Nautor)': {
    baseUrl: 'https://www.nautor.com',
    getUrl: (name) => {
      const map = {
        'Swan 38': 'https://www.nautor.com/swan/swan-38/',
        'Swan 43': 'https://www.nautor.com/swan/swan-43/',
        'Swan 48': 'https://www.nautor.com/swan/swan-48/',
        'Swan 55': 'https://www.nautor.com/swan/swan-55/',
        'Swan 65': 'https://www.nautor.com/swan/swan-65/',
        'Swan 78': 'https://www.nautor.com/swan/swan-78/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Catalina Yachts': {
    baseUrl: 'https://www.catalinayachts.com',
    getUrl: (name) => {
      const map = {
        'Catalina 14.2': 'https://www.catalinayachts.com/14-2',
        'Catalina 22 Sport': 'https://www.catalinayachts.com/22sport',
        'Catalina 275 Sport': 'https://www.catalinayachts.com/275',
        'Catalina 315': 'https://www.catalinayachts.com/315',
        'Catalina 355': 'https://www.catalinayachts.com/355',
        'Catalina 375': 'https://www.catalinayachts.com/375',
        'Catalina 425': 'https://www.catalinayachts.com/425',
        'Catalina 445': 'https://www.catalinayachts.com/445',
        'Catalina 545': 'https://www.catalinayachts.com/545',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Moody Yachts': {
    baseUrl: 'https://www.moodyyachts.com',
    getUrl: (name) => {
      const map = {
        'Moody 41': 'https://www.moodyyachts.com/en/moody-41/',
        'Moody 41 AC': 'https://www.moodyyachts.com/en/moody-41-ac/',
        'Moody 45': 'https://www.moodyyachts.com/en/moody-45/',
        'Moody DS45': 'https://www.moodyyachts.com/en/moody-ds45/',
        'Moody DS54': 'https://www.moodyyachts.com/en/moody-ds54/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Grand Soleil': {
    baseUrl: 'https://www.grandsoleil.net',
    getUrl: (name) => {
      const map = {
        'Grand Soleil 34': 'https://www.grandsoleil.net/en/yachts/grand-soleil-34/',
        'Grand Soleil 40': 'https://www.grandsoleil.net/en/yachts/grand-soleil-40/',
        'Grand Soleil 44': 'https://www.grandsoleil.net/en/yachts/grand-soleil-44/',
        'Grand Soleil 48': 'https://www.grandsoleil.net/en/yachts/grand-soleil-48/',
        'Grand Soleil 58': 'https://www.grandsoleil.net/en/yachts/grand-soleil-58/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Solaris Yachts': {
    baseUrl: 'https://www.solarisyachts.it',
    getUrl: (name) => {
      const map = {
        'Solaris 40': 'https://www.solarisyachts.it/sailing-yacht/solaris-40/',
        'Solaris 44': 'https://www.solarisyachts.it/sailing-yacht/solaris-44/',
        'Solaris 47': 'https://www.solarisyachts.it/sailing-yacht/solaris-47/',
        'Solaris 50': 'https://www.solarisyachts.it/sailing-yacht/solaris-50/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Wally': {
    baseUrl: 'https://www.wally.com',
    getUrl: (name) => {
      const map = {
        'Wally 48': 'https://www.wally.com/en/wally48',
        'Wally 55': 'https://www.wally.com/en/wally55',
        'Wallywhy 150': 'https://www.wally.com/en/wallywhy150',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Amel': {
    baseUrl: 'https://www.amel.fr',
    getUrl: (name) => {
      const map = {
        'Amel 50': 'https://www.amel.fr/en/amel-50/',
        'Amel 60': 'https://www.amel.fr/en/amel-60/',
        'Amel 80': 'https://www.amel.fr/en/amel-80/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Contest Yachts': {
    baseUrl: 'https://www.contestyachts.com',
    getUrl: (name) => {
      const map = {
        'Contest 42CS': 'https://www.contestyachts.com/contest-42cs/',
        'Contest 50CS': 'https://www.contestyachts.com/contest-50cs/',
        'Contest 67CS': 'https://www.contestyachts.com/contest-67cs/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'J/Boats': {
    baseUrl: 'https://jboats.com',
    getUrl: (name) => {
      const map = {
        'J/70': 'https://jboats.com/j70',
        'J/88': 'https://jboats.com/j88',
        'J/99': 'https://jboats.com/j99',
        'J/105': 'https://jboats.com/j105',
        'J/112E': 'https://jboats.com/j112e',
        'J/121': 'https://jboats.com/j121',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Hunter Yachts': {
    baseUrl: 'https://www.hunteryachts.com',
    getUrl: (name) => {
      // Hunter is now Marlow-Hunter, try their site
      const map = {
        'Hunter 31': 'https://www.hunteryachts.com/models/hunter-31/',
        'Hunter 33': 'https://www.hunteryachts.com/models/hunter-33/',
        'Hunter 37': 'https://www.hunteryachts.com/models/hunter-37/',
        'Hunter 40': 'https://www.hunteryachts.com/models/hunter-40/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Island Packet': {
    baseUrl: 'https://www.islandpacket.com',
    getUrl: (name) => {
      const map = {
        'Island Packet 31': 'https://www.islandpacket.com/yachts/ip31/',
        'Island Packet 35': 'https://www.islandpacket.com/yachts/ip35/',
        'Island Packet 38': 'https://www.islandpacket.com/yachts/ip38/',
        'Island Packet 42': 'https://www.islandpacket.com/yachts/ip42/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Arcona Yachts': {
    baseUrl: 'https://www.arconayachts.com',
    getUrl: (name) => {
      const map = {
        'Arcona 345': 'https://www.arconayachts.com/arcona-345/',
        'Arcona 385': 'https://www.arconayachts.com/arcona-385/',
        'Arcona 435': 'https://www.arconayachts.com/arcona-435/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Wauquiez': {
    baseUrl: 'https://www.wauquiez.com',
    getUrl: (name) => {
      const map = {
        'Wauquiez 42PS': 'https://www.wauquiez.com/en/wauquiez-42ps/',
        'Wauquiez 55DS': 'https://www.wauquiez.com/en/wauquiez-55ds/',
        'Wauquiez 60': 'https://www.wauquiez.com/en/wauquiez-60/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Tartan Yachts': {
    baseUrl: 'https://www.tartanyachts.com',
    getUrl: (name) => {
      const map = {
        'Tartan 245': 'https://www.tartanyachts.com/models/tartan-245/',
        'Tartan 365': 'https://www.tartanyachts.com/models/tartan-365/',
        'Tartan 4000': 'https://www.tartanyachts.com/models/tartan-4000/',
        'Tartan 4700': 'https://www.tartanyachts.com/models/tartan-4700/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Najad': {
    baseUrl: 'https://www.najad.com',
    getUrl: (name) => {
      const map = {
        'Najad 395': 'https://www.najad.com/najad-395/',
        'Najad 440': 'https://www.najad.com/najad-440/',
        'Najad 570': 'https://www.najad.com/najad-570/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Dragonfly Trimarans': {
    baseUrl: 'https://www.trimarans.com',
    getUrl: (name) => {
      const map = {
        'Dragonfly 25': 'https://www.trimarans.com/dragonfly-25/',
        'Dragonfly 28': 'https://www.trimarans.com/dragonfly-28/',
        'Dragonfly 40': 'https://www.trimarans.com/dragonfly-40/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Neel Trimarans': {
    baseUrl: 'https://www.neel-trimarans.com',
    getUrl: (name) => {
      const map = {
        'Neel 43': 'https://www.neel-trimarans.com/en/neel-43/',
        'Neel 47': 'https://www.neel-trimarans.com/en/neel-47/',
        'Neel 51': 'https://www.neel-trimarans.com/en/neel-51/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'RM Yachts': {
    baseUrl: 'https://www.rm-yachts.com',
    getUrl: (name) => {
      const map = {
        'RM 890': 'https://www.rm-yachts.com/en/rm-890/',
        'RM 1070': 'https://www.rm-yachts.com/en/rm-1070/',
        'RM 1200': 'https://www.rm-yachts.com/en/rm-1200/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Allures Yachting': {
    baseUrl: 'https://www.allures-yachting.com',
    getUrl: (name) => {
      const map = {
        'Allures 40.9': 'https://www.allures-yachting.com/en/allures-40-9/',
        'Allures 45.9': 'https://www.allures-yachting.com/en/allures-45-9/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Garcia Yachting': {
    baseUrl: 'https://www.garcia-yachting.com',
    getUrl: (name) => {
      const map = {
        'Garcia Exploration 45': 'https://www.garcia-yachting.com/en/garcia-exploration-45/',
        'Garcia Alaska 55': 'https://www.garcia-yachting.com/en/garcia-alaska-55/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Saffier Yachts': {
    baseUrl: 'https://www.saffieryachts.com',
    getUrl: (name) => {
      const map = {
        'Saffier SE 33': 'https://www.saffieryachts.com/saffier-se-33/',
        'Saffier SC 10m': 'https://www.saffieryachts.com/saffier-sc-10m/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Sunbeam Yachts': {
    baseUrl: 'https://www.sunbeam-yachts.com',
    getUrl: (name) => {
      const map = {
        'Sunbeam 32.1': 'https://www.sunbeam-yachts.com/en/sunbeam-32-1/',
        'Sunbeam 36.1': 'https://www.sunbeam-yachts.com/en/sunbeam-36-1/',
        'Sunbeam 41.1': 'https://www.sunbeam-yachts.com/en/sunbeam-41-1/',
        'Sunbeam 46.1': 'https://www.sunbeam-yachts.com/en/sunbeam-46-1/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Sirius Yachts': {
    baseUrl: 'https://www.sirius-yachts.com',
    getUrl: (name) => {
      const map = {
        'Sirius 310': 'https://www.sirius-yachts.com/en/sirius-310/',
        'Sirius 35': 'https://www.sirius-yachts.com/en/sirius-35/',
        'Sirius 40DS': 'https://www.sirius-yachts.com/en/sirius-40ds/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Bowman Yachts': {
    baseUrl: 'https://www.bowmanyachts.com',
    getUrl: (name) => {
      const map = {
        'Bowman 36': 'https://www.bowmanyachts.com/bowman-36/',
        'Bowman 40': 'https://www.bowmanyachts.com/bowman-40/',
        'Bowman 46': 'https://www.bowmanyachts.com/bowman-46/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'CNB': {
    baseUrl: 'https://www.cnb-yachts.com',
    getUrl: (name) => {
      const map = {
        'CNB 66': 'https://www.cnb-yachts.com/en/cnb-66/',
        'CNB 76': 'https://www.cnb-yachts.com/en/cnb-76/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Delphia Yachts': {
    baseUrl: 'https://www.delphia-yachts.com',
    getUrl: (name) => {
      const map = {
        'Delphia 31': 'https://www.delphia-yachts.com/en/delphia-31/',
        'Delphia 40': 'https://www.delphia-yachts.com/en/delphia-40/',
        'Delphia 47': 'https://www.delphia-yachts.com/en/delphia-47/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Feeling': {
    baseUrl: 'https://www.feeling-yachts.com',
    getUrl: (name) => {
      const map = {
        'Feeling 32': 'https://www.feeling-yachts.com/en/feeling-32/',
        'Feeling 39': 'https://www.feeling-yachts.com/en/feeling-39/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Hatteland': {
    baseUrl: 'https://www.hatteland.com',
    getUrl: (name) => null, // Small Norwegian builder, no model pages
    extractImage: 'og_or_largest'
  },

  'Mylius': {
    baseUrl: 'https://www.mylius.it',
    getUrl: (name) => {
      const map = {
        'Mylius 50': 'https://www.mylius.it/mylius-50/',
        'Mylius 60': 'https://www.mylius.it/mylius-60/',
        'Mylius 76': 'https://www.mylius.it/mylius-76/',
      };
      return map[name] || null;
    },
    extractImage: 'og_or_largest'
  },

  'Vancouver (Northshore)': {
    baseUrl: 'https://www.northshore.co.uk',
    getUrl: (name) => null, // No longer trading
    extractImage: 'og_or_largest'
  },
};

// Generic og:image or largest image extractor
async function genericExtract(page) {
  // 1. Try og:image
  const og = await page.evaluate(() => {
    const el = document.querySelector('meta[property="og:image"]');
    return el ? el.content : null;
  });
  if (og && og.startsWith('http') && !og.includes('blank') && og.length > 10) return og;

  // 2. Try twitter:image
  const tw = await page.evaluate(() => {
    const el = document.querySelector('meta[name="twitter:image"]') ||
               document.querySelector('meta[property="twitter:image"]');
    return el ? el.content : null;
  });
  if (tw && tw.startsWith('http') && tw.length > 10) return tw;

  // 3. Largest image on the page (excluding UI elements)
  return await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].filter(i => {
      const src = i.src || i.dataset.src || '';
      return src.startsWith('http') && i.naturalWidth > 400
        && !src.includes('icon') && !src.includes('logo') && !src.includes('flag')
        && !src.includes('menu') && !src.includes('favicon') && !src.includes('sprite')
        && !src.includes('button') && !src.includes('social') && !src.includes('arrow')
        && !src.includes('close') && !src.includes('burger');
    });
    if (imgs.length === 0) return null;
    imgs.sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
    return imgs[0].src || imgs[0].dataset.src;
  });
}

async function main() {
  const result = await pool.query(`
    SELECT y.id as yid, y.model_name, m.name as mfg
    FROM yacht_models y
    JOIN manufacturers m ON y.manufacturer_id = m.id
    JOIN images i ON i.yacht_model_id = y.id AND i.is_primary = true
    WHERE i.url LIKE '%unsplash%'
    ORDER BY m.name, y.model_name
  `);

  console.log(`\n🚀 Sailing Yacht Image Scraper`);
  console.log(`Found ${result.rows.length} models with Unsplash images to replace\n`);

  if (LIST_ONLY) {
    for (const row of result.rows) {
      const mfg = MANUFACTURER_URLS[row.mfg];
      const url = mfg ? mfg.getUrl(row.model_name) : null;
      console.log(`  ${url ? '✅' : '❌'} ${row.mfg} → ${row.model_name} ${url || '(no URL mapping)'}`);
    }
    await pool.end();
    return;
  }

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  let updated = 0, failed = 0, skipped = 0;
  const results = [];

  for (const row of result.rows) {
    if (MFG_FILTER && row.mfg !== MFG_FILTER) continue;

    const mfg = MANUFACTURER_URLS[row.mfg];
    const url = mfg ? mfg.getUrl(row.model_name) : null;

    if (!url) {
      console.log(`  ⏭️  ${row.mfg} ${row.model_name} — no URL mapping`);
      skipped++;
      continue;
    }

    console.log(`  🌐 ${row.mfg} ${row.model_name} → ${url}`);

    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait a bit more for lazy images
      await page.waitForTimeout(1500);

      // Scroll down to trigger lazy loading
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await page.waitForTimeout(500);

      let imgUrl;
      if (typeof mfg.extractImage === 'function') {
        imgUrl = await mfg.extractImage(page);
      } else {
        imgUrl = await genericExtract(page);
      }

      if (!imgUrl || !imgUrl.startsWith('http')) {
        console.log(`      ❌ No image found`);
        failed++;
        results.push({ mfg: row.mfg, model: row.model_name, status: 'no_image' });
      } else {
        console.log(`      ✅ ${imgUrl}`);
        if (!DRY_RUN) {
          await pool.query(
            'UPDATE images SET url = $1 WHERE yacht_model_id = $2 AND is_primary = true',
            [imgUrl, row.yid]
          );
        }
        updated++;
        results.push({ mfg: row.mfg, model: row.model_name, status: 'ok', url: imgUrl });
      }
    } catch (err) {
      console.log(`      ❌ Error: ${err.message}`);
      failed++;
      results.push({ mfg: row.mfg, model: row.model_name, status: 'error', error: err.message });
    } finally {
      await page.close();
    }

    // Be polite
    await new Promise(r => setTimeout(r, 500));
  }

  await browser.close();
  await pool.end();

  console.log(`\n📊 Results: ${updated} updated, ${failed} failed, ${skipped} skipped`);

  // Write results to file for review
  if (!DRY_RUN && updated > 0) {
    const fs = require('fs');
    const reportPath = 'scripts/image-scraper-results.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📝 Results written to ${reportPath}`);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
