#!/usr/bin/env node
/**
 * v2: Smart manufacturer image scraper with alt-text matching.
 * Uses Playwright to load JS-rendered pages and match model-specific images.
 */
require('dotenv').config();
const { chromium } = require('playwright');
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const DRY_RUN = process.argv.includes('--dry-run');
const MFG_FILTER = process.argv.includes('--mfg') ? process.argv[process.argv.indexOf('--mfg') + 1] : null;
const VERBOSE = process.argv.includes('--verbose');

// Strategies for extracting the hero image from a page
const STRATEGIES = {
  // Match image by alt text containing the model name
  ALT_MATCH: 'alt_match',
  // Use og:image meta tag
  OG_IMAGE: 'og_image',
  // Largest image on page (filtered)
  LARGEST: 'largest',
  // Match by alt text, then decode the URL and look for a higher-res version
  ALT_WITH_HD: 'alt_with_hd',
};

// Manufacturer configs: each defines how to build URLs and extract images
const MFG_CONFIGS = {
  'Beneteau': {
    urls: {
      'Oceanis 30.1': 'https://www.beneteau.com/oceanis/oceanis-301',
      'Oceanis 34.1': 'https://www.beneteau.com/oceanis/oceanis-341',
      'Oceanis 38.1': 'https://www.beneteau.com/oceanis/oceanis-371',
      'Oceanis 40.1': 'https://www.beneteau.com/oceanis/oceanis-401',
      'Oceanis 46.1': 'https://www.beneteau.com/oceanis/oceanis-47',
      'Oceanis 51.1': 'https://www.beneteau.com/oceanis/oceanis-52',
      'Oceanis Yacht 54': 'https://www.beneteau.com/oceanis-yacht/oceanis-yacht-54',
      'Oceanis Yacht 62': 'https://www.beneteau.com/oceanis-yacht/oceanis-yacht-60',
      'First 24': 'https://www.beneteau.com/first/first-24',
      'First 27': 'https://www.beneteau.com/first/first-27',
      'First 27 SE': 'https://www.beneteau.com/first/first-27-se',
      'First 36': 'https://www.beneteau.com/first/first-36',
      'First 44': 'https://www.beneteau.com/first/first-44',
    },
    strategy: STRATEGIES.LARGEST,
    filter: (src) => src.includes('sites/default/files/styles/article_main_desktop') || src.includes('sites/default/files/styles/wide'),
  },

  'Jeanneau': {
    urls: {
      'Sun Odyssey 320': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/749-sun-odyssey-320',
      'Sun Odyssey 349': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/84-sun-odyssey-349',
      'Sun Odyssey 350': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/737-sun-odyssey-350',
      'Sun Odyssey 380': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/709-sun-odyssey-380',
      'Sun Odyssey 410': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/629-sun-odyssey-410',
      'Sun Odyssey 440': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/661-sun-odyssey-440',
      'Sun Odyssey 490': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/682-sun-odyssey-490',
      'Sun Odyssey 495': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/749-sun-odyssey-495',
      'Sun Fast 3300': 'https://www.jeanneau.com/en/boats/sailboat/14-sun-fast/706-sun-fast-3300',
      'Jeanneau 53': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/595-jeanneau-53',
      'Jeanneau 64': 'https://www.jeanneau.com/en/boats/sailboat/2-sun-odyssey/617-jeanneau-64',
    },
    strategy: STRATEGIES.ALT_WITH_HD,
    // Jeanneau pages redirect to range page; find the model by alt text
    altMatch: (modelName) => {
      const m = modelName.replace('Sun Odyssey ', 'Sun Odyssey ');
      return m;
    },
    hdTransform: (url) => url.replace('/exterior/sd/', '/exterior/hd/').replace('/shape/', '/image/exterior/hd/'),
  },

  'Bavaria Yachts': {
    urls: {
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
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Hanse Yachts': {
    urls: {
      'Hanse 315': 'https://www.hanseyachts.com/en/hanse-315',
      'Hanse 348': 'https://www.hanseyachts.com/en/hanse-348',
      'Hanse 388': 'https://www.hanseyachts.com/en/hanse-388',
      'Hanse 415': 'https://www.hanseyachts.com/en/hanse-415',
      'Hanse 458': 'https://www.hanseyachts.com/en/hanse-458',
      'Hanse 460': 'https://www.hanseyachts.com/en/hanse-460',
      'Hanse 548': 'https://www.hanseyachts.com/en/hanse-548',
      'Hanse 588': 'https://www.hanseyachts.com/en/hanse-588',
      'Hanse 675': 'https://www.hanseyachts.com/en/hanse-675',
    },
    strategy: STRATEGIES.ALT_MATCH,
    // Hanse pages show all models; match by alt text
    altMatch: (name) => name,
  },

  'Dufour Yachts': {
    urls: {
      'Dufour 320': 'https://www.dufour-yachts.com/en/dufour-320/',
      'Dufour 37': 'https://www.dufour-yachts.com/en/dufour-37/',
      'Dufour 41': 'https://www.dufour-yachts.com/en/dufour-41/',
      'Dufour 470': 'https://www.dufour-yachts.com/en/dufour-470/',
      'Dufour 530': 'https://www.dufour-yachts.com/en/dufour-530/',
      'Dufour 56': 'https://www.dufour-yachts.com/en/dufour-56/',
      'Dufour 390 Grand Large': 'https://www.dufour-yachts.com/en/dufour-390-grand-large/',
      'Dufour 430 Grand Large': 'https://www.dufour-yachts.com/en/dufour-430-grand-large/',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name.replace(' Grand Large', ''),
  },

  'Dehler': {
    urls: {
      'Dehler 30 OD': 'https://www.dehler.com/en/dehler-30-od',
      'Dehler 32': 'https://www.dehler.com/en/dehler-32',
      'Dehler 34': 'https://www.dehler.com/en/dehler-34',
      'Dehler 38': 'https://www.dehler.com/en/dehler-38',
      'Dehler 38 SQ': 'https://www.dehler.com/en/dehler-38-sq',
      'Dehler 42': 'https://www.dehler.com/en/dehler-42',
      'Dehler 46': 'https://www.dehler.com/en/dehler-46',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name,
  },

  'Moody Yachts': {
    urls: {
      'Moody 41': 'https://www.moody-yachts.com/en/moody-41/',
      'Moody 41 AC': 'https://www.moody-yachts.com/en/moody-41-ac/',
      'Moody 45': 'https://www.moody-yachts.com/en/moody-45/',
      'Moody DS45': 'https://www.moody-yachts.com/en/moody-ds45/',
      'Moody DS54': 'https://www.moody-yachts.com/en/moody-ds54/',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name,
  },

  'Elan Yachts': {
    urls: {
      'Elan E1': 'https://www.elan-yachts.com/en/e1/',
      'Elan E3': 'https://www.elan-yachts.com/en/e3/',
      'Elan E4': 'https://www.elan-yachts.com/en/e4/',
      'Elan E5': 'https://www.elan-yachts.com/en/e5/',
      'Elan E6': 'https://www.elan-yachts.com/en/e6/',
      'Elan GT5': 'https://www.elan-yachts.com/en/gt5/',
      'Elan Impression 45.1': 'https://www.elan-yachts.com/en/impression-45-1/',
      'Elan Impression 50.1': 'https://www.elan-yachts.com/en/impression-50-1/',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name,
  },

  'X-Yachts': {
    urls: {
      'X35': 'https://www.x-yachts.com/yachts/x/yacht/x35/',
      'X41': 'https://www.x-yachts.com/yachts/x/yacht/x41/',
      'X4³': 'https://www.x-yachts.com/yachts/x/yacht/x4-3/',
      'X5⁶': 'https://www.x-yachts.com/yachts/x/yacht/x5-6/',
      'Xc 45': 'https://www.x-yachts.com/yachts/xc/yacht/xc-45/',
      'Xc 50': 'https://www.x-yachts.com/yachts/xc/yacht/xc-50/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Lagoon': {
    urls: {
      'Lagoon 38': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-38',
      'Lagoon 40': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-40',
      'Lagoon 42': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-42',
      'Lagoon 46': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-46',
      'Lagoon 51': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-51',
      'Lagoon 55': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-55',
      'Lagoon 450 F': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-450',
      'Lagoon Sixty 5': 'https://www.lagoon-catamarans.com/en/catamarans-lagoon/sailing-catamaran/lagoon-sixty-5',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Hallberg-Rassy': {
    urls: {
      'Hallberg-Rassy 340': 'https://www.hallberg-rassy.com/models/hr340/',
      'Hallberg-Rassy 40C': 'https://www.hallberg-rassy.com/models/hr40c/',
      'Hallberg-Rassy 44': 'https://www.hallberg-rassy.com/models/hr44/',
      'Hallberg-Rassy 48': 'https://www.hallberg-rassy.com/models/hr48/',
      'Hallberg-Rassy 57': 'https://www.hallberg-rassy.com/models/hr57/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Swan (Nautor)': {
    urls: {
      'Swan 38': 'https://www.nautor.com/swan/swan-38/',
      'Swan 43': 'https://www.nautor.com/swan/swan-43/',
      'Swan 48': 'https://www.nautor.com/swan/swan-48/',
      'Swan 55': 'https://www.nautor.com/swan/swan-55/',
      'Swan 65': 'https://www.nautor.com/swan/swan-65/',
      'Swan 78': 'https://www.nautor.com/swan/swan-78/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Oyster Yachts': {
    urls: {
      'Oyster 475': 'https://www.oysteryachts.com/yachts/oyster-475/',
      'Oyster 495': 'https://www.oysteryachts.com/yachts/oyster-495/',
      'Oyster 565': 'https://www.oysteryachts.com/yachts/oyster-565/',
      'Oyster 595': 'https://www.oysteryachts.com/yachts/oyster-595/',
      'Oyster 745': 'https://www.oysteryachts.com/yachts/oyster-745/',
      'Oyster 885': 'https://www.oysteryachts.com/yachts/oyster-885/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Catalina Yachts': {
    urls: {
      'Catalina 14.2': 'https://www.catalinayachts.com/14-2',
      'Catalina 22 Sport': 'https://www.catalinayachts.com/22sport',
      'Catalina 275 Sport': 'https://www.catalinayachts.com/275',
      'Catalina 315': 'https://www.catalinayachts.com/315',
      'Catalina 355': 'https://www.catalinayachts.com/355',
      'Catalina 375': 'https://www.catalinayachts.com/375',
      'Catalina 425': 'https://www.catalinayachts.com/425',
      'Catalina 445': 'https://www.catalinayachts.com/445',
      'Catalina 545': 'https://www.catalinayachts.com/545',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Grand Soleil': {
    urls: {
      'Grand Soleil 34': 'https://www.grandsoleil.net/en/yachts/grand-soleil-34/',
      'Grand Soleil 40': 'https://www.grandsoleil.net/en/yachts/grand-soleil-40/',
      'Grand Soleil 44': 'https://www.grandsoleil.net/en/yachts/grand-soleil-44/',
      'Grand Soleil 48': 'https://www.grandsoleil.net/en/yachts/grand-soleil-48/',
      'Grand Soleil 58': 'https://www.grandsoleil.net/en/yachts/grand-soleil-58/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Amel': {
    urls: {
      'Amel 50': 'https://www.amel.fr/en/amel-50/',
      'Amel 60': 'https://www.amel.fr/en/amel-60/',
      'Amel 80': 'https://www.amel.fr/en/amel-80/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Contest Yachts': {
    urls: {
      'Contest 42CS': 'https://www.contestyachts.com/contest-42cs/',
      'Contest 50CS': 'https://www.contestyachts.com/contest-50cs/',
      'Contest 67CS': 'https://www.contestyachts.com/contest-67cs/',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name,
  },

  'Solaris Yachts': {
    urls: {
      'Solaris 40': 'https://www.solarisyachts.it/sailing-yacht/solaris-40/',
      'Solaris 44': 'https://www.solarisyachts.it/sailing-yacht/solaris-44/',
      'Solaris 47': 'https://www.solarisyachts.it/sailing-yacht/solaris-47/',
      'Solaris 50': 'https://www.solarisyachts.it/sailing-yacht/solaris-50/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Wally': {
    urls: {
      'Wally 48': 'https://www.wally.com/en/wally48',
      'Wally 55': 'https://www.wally.com/en/wally55',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'RM Yachts': {
    urls: {
      'RM 890': 'https://www.rm-yachts.com/en/rm-890/',
      'RM 1070': 'https://www.rm-yachts.com/en/rm-1070/',
      'RM 1200': 'https://www.rm-yachts.com/en/rm-1200/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Sunbeam Yachts': {
    urls: {
      'Sunbeam 32.1': 'https://www.sunbeam-yachts.com/en/sunbeam-32-1/',
      'Sunbeam 36.1': 'https://www.sunbeam-yachts.com/en/sunbeam-36-1/',
      'Sunbeam 41.1': 'https://www.sunbeam-yachts.com/en/sunbeam-41-1/',
      'Sunbeam 46.1': 'https://www.sunbeam-yachts.com/en/sunbeam-46-1/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Najad': {
    urls: {
      'Najad 395': 'https://www.najad.com/najad-395/',
      'Najad 440': 'https://www.najad.com/najad-440/',
      'Najad 570': 'https://www.najad.com/najad-570/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Neel Trimarans': {
    urls: {
      'Neel 43': 'https://www.neel-trimarans.com/en/neel-43/',
      'Neel 47': 'https://www.neel-trimarans.com/en/neel-47/',
      'Neel 51': 'https://www.neel-trimarans.com/en/neel-51/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Saffier Yachts': {
    urls: {
      'Saffier SE 33': 'https://www.saffieryachts.com/saffier-se-33/',
      'Saffier SC 10m': 'https://www.saffieryachts.com/saffier-sc-10m/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Garcia Yachting': {
    urls: {
      'Garcia Exploration 45': 'https://www.garcia-yachting.com/en/garcia-exploration-45/',
      'Garcia Alaska 55': 'https://www.garcia-yachting.com/en/garcia-alaska-55/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Wauquiez': {
    urls: {
      'Wauquiez 42PS': 'https://www.wauquiez.com/en/wauquiez-42ps/',
      'Wauquiez 55DS': 'https://www.wauquiez.com/en/wauquiez-55ds/',
      'Wauquiez 60': 'https://www.wauquiez.com/en/wauquiez-60/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Arcona Yachts': {
    urls: {
      'Arcona 345': 'https://www.arconayachts.com/arcona-345/',
      'Arcona 385': 'https://www.arconayachts.com/arcona-385/',
      'Arcona 435': 'https://www.arconayachts.com/arcona-435/',
    },
    strategy: STRATEGIES.OG_IMAGE,
    ignoreSSLErrors: true,
  },

  'J/Boats': {
    urls: {
      'J/70': 'https://jboats.com/j70',
      'J/88': 'https://jboats.com/j88',
      'J/99': 'https://jboats.com/j99',
      'J/105': 'https://jboats.com/j105',
      'J/112E': 'https://jboats.com/j112e',
      'J/121': 'https://jboats.com/j121',
    },
    strategy: STRATEGIES.ALT_MATCH,
    altMatch: (name) => name,
  },

  'Hunter Yachts': {
    urls: {
      'Hunter 31': 'https://www.hunteryachts.com/models/hunter-31/',
      'Hunter 33': 'https://www.hunteryachts.com/models/hunter-33/',
      'Hunter 37': 'https://www.hunteryachts.com/models/hunter-37/',
      'Hunter 40': 'https://www.hunteryachts.com/models/hunter-40/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Island Packet': {
    urls: {
      'Island Packet 31': 'https://www.islandpacket.com/yachts/ip31/',
      'Island Packet 35': 'https://www.islandpacket.com/yachts/ip35/',
      'Island Packet 38': 'https://www.islandpacket.com/yachts/ip38/',
      'Island Packet 42': 'https://www.islandpacket.com/yachts/ip42/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Tartan Yachts': {
    urls: {
      'Tartan 245': 'https://www.tartanyachts.com/models/tartan-245/',
      'Tartan 365': 'https://www.tartanyachts.com/models/tartan-365/',
      'Tartan 4000': 'https://www.tartanyachts.com/models/tartan-4000/',
      'Tartan 4700': 'https://www.tartanyachts.com/models/tartan-4700/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Dragonfly Trimarans': {
    urls: {
      'Dragonfly 25': 'https://www.trimarans.com/dragonfly-25/',
      'Dragonfly 28': 'https://www.trimarans.com/dragonfly-28/',
      'Dragonfly 40': 'https://www.trimarans.com/dragonfly-40/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Mylius': {
    urls: {
      'Mylius 50': 'https://www.mylius.it/mylius-50/',
      'Mylius 60': 'https://www.mylius.it/mylius-60/',
      'Mylius 76': 'https://www.mylius.it/mylius-76/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'Sirius Yachts': {
    urls: {
      'Sirius 310': 'https://www.sirius-yachts.com/en/sirius-310/',
      'Sirius 35': 'https://www.sirius-yachts.com/en/sirius-35/',
      'Sirius 40DS': 'https://www.sirius-yachts.com/en/sirius-40ds/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },

  'CNB': {
    urls: {
      'CNB 66': 'https://www.cnb-yachts.com/en/cnb-66/',
      'CNB 76': 'https://www.cnb-yachts.com/en/cnb-76/',
    },
    strategy: STRATEGIES.OG_IMAGE,
    ignoreSSLErrors: true,
  },

  'Delphia Yachts': {
    urls: {
      'Delphia 31': 'https://www.delphia-yachts.com/en/delphia-31/',
      'Delphia 40': 'https://www.delphia-yachts.com/en/delphia-40/',
      'Delphia 47': 'https://www.delphia-yachts.com/en/delphia-47/',
    },
    strategy: STRATEGIES.OG_IMAGE,
  },
};

async function extractImage(page, config, modelName) {
  const strategy = config.strategy || STRATEGIES.OG_IMAGE;

  if (strategy === STRATEGIES.ALT_MATCH || strategy === STRATEGIES.ALT_WITH_HD) {
    const altText = config.altMatch ? config.altMatch(modelName) : modelName;
    const result = await page.evaluate((searchAlt) => {
      const imgs = [...document.querySelectorAll('img')];
      // Try exact alt match first
      let match = imgs.find(i => i.alt && i.alt.toLowerCase() === searchAlt.toLowerCase());
      if (!match) {
        // Try contains
        match = imgs.find(i => i.alt && i.alt.toLowerCase().includes(searchAlt.toLowerCase()));
      }
      if (!match) {
        // Try data-src
        match = imgs.find(i => {
          const ds = i.dataset.src || '';
          return ds && i.alt && i.alt.toLowerCase().includes(searchAlt.toLowerCase());
        });
      }
      if (!match) return null;
      return {
        src: match.src || match.dataset.src,
        dataSrc: match.dataset.src,
        alt: match.alt,
        w: match.naturalWidth,
      };
    }, altText);

    if (result && result.src) {
      let url = result.src;
      if (strategy === STRATEGIES.ALT_WITH_HD && config.hdTransform) {
        url = config.hdTransform(url);
      }
      return url;
    }
    // Fallback to og:image
  }

  // OG_IMAGE strategy (also fallback)
  const og = await page.evaluate(() => {
    const el = document.querySelector('meta[property="og:image"]');
    return el ? el.content : null;
  });
  if (og && og.startsWith('http') && og.length > 20 && !og.includes('logo') && !og.includes('404')) return og;

  // twitter:image
  const tw = await page.evaluate(() => {
    const el = document.querySelector('meta[name="twitter:image"]') || document.querySelector('meta[property="twitter:image"]');
    return el ? el.content : null;
  });
  if (tw && tw.startsWith('http') && tw.length > 20) return tw;

  // LARGEST strategy
  if (strategy === STRATEGIES.LARGEST || strategy === STRATEGIES.OG_IMAGE) {
    const filter = config.filter;
    const url = await page.evaluate((hasFilter) => {
      const imgs = [...document.querySelectorAll('img')].filter(i => {
        const src = i.src || '';
        return src.startsWith('http') && i.naturalWidth > 400
          && !src.includes('icon') && !src.includes('logo') && !src.includes('flag')
          && !src.includes('favicon') && !src.includes('sprite') && !src.includes('button')
          && !src.includes('social') && !src.includes('arrow') && !src.includes('close');
      });
      if (imgs.length === 0) return null;
      imgs.sort((a, b) => (b.naturalWidth * b.naturalHeight) - (a.naturalWidth * a.naturalHeight));
      return imgs[0].src;
    });
    if (url) return url;
  }

  return null;
}

async function main() {
  // Get all models that need images (empty or unsplash)
  const result = await pool.query(`
    SELECT y.id as yid, y.model_name, m.name as mfg, i.url
    FROM yacht_models y
    JOIN manufacturers m ON y.manufacturer_id = m.id
    JOIN images i ON i.yacht_model_id = y.id AND i.is_primary = true
    WHERE i.url LIKE '%unsplash%' OR i.url = '' OR i.url IS NULL
    ORDER BY m.name, y.model_name
  `);

  console.log(`\n🚀 Smart Manufacturer Image Scraper v2`);
  console.log(`Models needing images: ${result.rows.length}\n`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  let updated = 0, failed = 0, skipped = 0;
  const results = [];
  let currentMfg = null;
  let cachedMfgPage = null;

  for (const row of result.rows) {
    if (MFG_FILTER && row.mfg !== MFG_FILTER) continue;

    const config = MFG_CONFIGS[row.mfg];
    const url = config ? (config.urls[row.model_name] || null) : null;

    if (!url || !config) {
      console.log(`  ⏭️  ${row.mfg} ${row.model_name} — no config`);
      skipped++;
      continue;
    }

    // For manufacturers where all models are on one page (like Hanse), reuse the page
    const needsNewPage = !cachedMfgPage || currentMfg !== row.mfg;

    if (needsNewPage && cachedMfgPage) {
      await cachedMfgPage.close().catch(() => {});
      cachedMfgPage = null;
    }

    console.log(`  🌐 ${row.mfg} ${row.model_name}`);

    try {
      const ctxOptions = {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      };
      if (config.ignoreSSLErrors) ctxOptions.ignoreHTTPSErrors = true;

      const context = browser.contexts()[0] || await browser.newContext(ctxOptions);

      const page = needsNewPage
        ? await context.newPage()
        : cachedMfgPage;

      if (needsNewPage) {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1500);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(500);
        currentMfg = row.mfg;
        cachedMfgPage = page;
      }

      const imgUrl = await extractImage(page, config, row.model_name);

      if (!imgUrl || !imgUrl.startsWith('http') || imgUrl.length < 20) {
        console.log(`      ❌ No image found`);
        failed++;
        results.push({ mfg: row.mfg, model: row.model_name, status: 'no_image', url });
      } else {
        // Validate it's not a generic/bad image
        const badPatterns = ['logo.svg', '/404', 'hugedomains', 'services.png', 'box-bg-dark', 'favicon'];
        const isBad = badPatterns.some(p => imgUrl.includes(p));
        if (isBad) {
          console.log(`      ⚠️  Bad image: ${imgUrl.substring(0, 80)}`);
          failed++;
          results.push({ mfg: row.mfg, model: row.model_name, status: 'bad', url: imgUrl });
        } else {
          console.log(`      ✅ ${imgUrl.substring(0, 100)}`);
          if (!DRY_RUN) {
            await pool.query(
              'UPDATE images SET url = $1 WHERE yacht_model_id = $2 AND is_primary = true',
              [imgUrl, row.yid]
            );
          }
          updated++;
          results.push({ mfg: row.mfg, model: row.model_name, status: 'ok', url: imgUrl });
        }
      }
    } catch (err) {
      console.log(`      ❌ Error: ${err.message.substring(0, 80)}`);
      failed++;
      results.push({ mfg: row.mfg, model: row.model_name, status: 'error', error: err.message.substring(0, 100) });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  if (cachedMfgPage) await cachedMfgPage.close().catch(() => {});
  await browser.close();
  await pool.end();

  console.log(`\n📊 Results: ${updated} updated, ${failed} failed, ${skipped} skipped`);

  if (!DRY_RUN && updated > 0) {
    const fs = require('fs');
    fs.writeFileSync('scripts/image-scraper-v2-results.json', JSON.stringify(results, null, 2));
    console.log('📝 Results saved to scripts/image-scraper-v2-results.json');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
