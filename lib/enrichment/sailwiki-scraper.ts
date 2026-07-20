/**
 * SailWiki scraper for yacht specification verification.
 *
 * Fetches yacht data from sailwiki.com to verify/correct production years,
 * specs, and manufacturer status. Uses the site's HTML pages (no public API).
 *
 * Key data extracted:
 *   - Period of manufacturing (first_built / last_built)
 *   - LOA, beam, draft, displacement
 *   - Hull type, keel, rig, cabins, berths, heads
 *   - Shipyard (manufacturer) verification
 */

const BASE_URL = "https://sailwiki.com";

export interface SailWikiSpecs {
  sourceUrl: string;
  manufacturer: string;
  model: string;
  firstBuilt?: number;
  lastBuilt?: number;
  productionStatus: "in_production" | "out_of_production" | "unknown";
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  maxDraft?: number;
  displacement?: number;
  hullType?: string;
  hullMaterial?: string;
  keelType?: string;
  rigType?: string;
  cabins?: number;
  berths?: number;
  heads?: number;
  enginePower?: number;
  engineType?: string;
  designer?: string;
  ceClass?: string;
}

/** Parse a sailwiki yacht page HTML into structured specs. */
export function parseSailWikiYachtHtml(
  html: string,
  sourceUrl: string,
): SailWikiSpecs | null {
  // Check for 404 / not found
  if (
    html.includes("Page not found") ||
    html.includes("404") && html.length < 2000
  ) {
    return null;
  }

  const specs: SailWikiSpecs = {
    sourceUrl,
    manufacturer: "",
    model: "",
    productionStatus: "unknown",
  };

  // Extract all table rows
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/g;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g;
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        const text = cellMatch[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&#\d+;/g, "")
          .replace(/\s+/g, " ")
          .trim();
        cells.push(text);
      }

      if (cells.length < 2) continue;
      const key = cells[0].toLowerCase().trim();
      const value = cells.slice(1).join(" ").trim();

      // Map sailwiki fields to our schema
      switch (true) {
        case key === "shipyard":
          specs.manufacturer = value.split("(")[0].trim();
          break;
        case key === "period of manufacturing":
          parseProductionPeriod(value, specs);
          break;
        case key === "length, m" || key === "length":
          specs.lengthOverall = parseFloat(value) || undefined;
          break;
        case key === "beam, m" || key === "beam":
          specs.beam = parseFloat(value) || undefined;
          break;
        case key === "draft, m" || key === "draft":
          specs.draft = parseFloat(value) || undefined;
          break;
        case key === "max draft, m" || key === "max draft":
          specs.maxDraft = parseFloat(value) || undefined;
          break;
        case key === "displacement, kg" || key === "displacement":
          specs.displacement = parseFloat(value.replace(/,/g, "")) || undefined;
          break;
        case key === "hull type":
          specs.hullType = value;
          break;
        case key === "hull material":
          specs.hullMaterial = value.split(",")[0].trim();
          break;
        case key === "keel":
          specs.keelType = value;
          break;
        case key === "rig":
          specs.rigType = value.split(",")[0].trim();
          break;
        case key === "cabins":
          specs.cabins = parseInt(value) || undefined;
          break;
        case key === "berths for guests" || key === "berths":
          specs.berths = parseInt(value) || undefined;
          break;
        case key === "bathrooms" || key === "heads":
          specs.heads = parseInt(value) || undefined;
          break;
        case key === "engine power":
          specs.enginePower = parseFloat(value) || undefined;
          break;
        case key === "engine type":
          specs.engineType = value;
          break;
        case key === "designer":
          specs.designer = value;
          break;
        case key === "ce class":
          specs.ceClass = value;
          break;
      }
    }
  }

  // Also extract model name from page title
  const titleMatch = html.match(
    /<h[12][^>]*class="[^"]*text-gray[^"]*"[^>]*>([\s\S]*?)<\/h[12]>/,
  );
  if (titleMatch) {
    specs.model = titleMatch[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .trim();
  }

  // If we got no table data at all, return null
  if (!specs.manufacturer && !specs.lengthOverall && !specs.firstBuilt) {
    return null;
  }

  return specs;
}

/** Parse production period string like "2000, 2016 - 2009" or "2019 - present" */
function parseProductionPeriod(value: string, specs: SailWikiSpecs): void {
  // Handle "2019 - present" or "2019 – present"
  const presentMatch = value.match(/(\d{4})\s*[-–]\s*(?:present|current|now)/i);
  if (presentMatch) {
    specs.firstBuilt = parseInt(presentMatch[1]);
    specs.lastBuilt = undefined;
    specs.productionStatus = "in_production";
    return;
  }

  // Handle "2000, 2016 - 2009" (sailwiki format: start, end - restart_end)
  // This is weird but seen on the site: "2000, 2016 - 2009" means
  // production started 2000, resumed 2016, originally ended 2009
  const complexMatch = value.match(/(\d{4})[,\s]+(\d{4})\s*[-–]\s*(\d{4})/);
  if (complexMatch) {
    specs.firstBuilt = parseInt(complexMatch[1]);
    specs.lastBuilt = parseInt(complexMatch[2]); // latest known end or still going
    // If the resumed date is recent and no new end, it might still be in production
    const resumedYear = parseInt(complexMatch[2]);
    if (resumedYear >= new Date().getFullYear() - 2) {
      specs.productionStatus = "in_production";
    } else {
      specs.productionStatus = "out_of_production";
    }
    return;
  }

  // Handle "2005 - 2015" or "2005 – 2015"
  const rangeMatch = value.match(/(\d{4})\s*[-–]\s*(\d{4})/);
  if (rangeMatch) {
    specs.firstBuilt = parseInt(rangeMatch[1]);
    specs.lastBuilt = parseInt(rangeMatch[2]);
    specs.productionStatus = "out_of_production";
    return;
  }

  // Handle single year "2005"
  const singleYear = value.match(/(\d{4})/);
  if (singleYear) {
    specs.firstBuilt = parseInt(singleYear[1]);
    // Check if still in production (current year or "present")
    if (value.toLowerCase().includes("present")) {
      specs.productionStatus = "in_production";
    } else {
      specs.lastBuilt = parseInt(singleYear[1]);
      specs.productionStatus = "out_of_production";
    }
  }
}

/** Build a likely sailwiki yacht URL from manufacturer + model. */
export function buildSailWikiYachtUrl(manufacturer: string, model: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `${BASE_URL}/yacht/${normalize(manufacturer)}-${normalize(model)}/`;
}

/** Fetch and parse a yacht page from sailwiki.com. */
export async function fetchSailWikiYacht(
  url: string,
  fetchFn: typeof fetch = fetch,
): Promise<SailWikiSpecs | null> {
  try {
    const response = await fetchFn(url, {
      headers: {
        "User-Agent": "SailboatsFR-Bot/1.0 (contact@sailboats.fr)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    return parseSailWikiYachtHtml(html, url);
  } catch {
    return null;
  }
}

/** Search for a yacht on sailwiki by trying URL variants. */
export async function searchSailWikiYacht(
  manufacturer: string,
  model: string,
  fetchFn: typeof fetch = fetch,
): Promise<SailWikiSpecs | null> {
  // Try direct URL first
  const directUrl = buildSailWikiYachtUrl(manufacturer, model);
  const specs = await fetchSailWikiYacht(directUrl, fetchFn);
  if (specs) return specs;

  // Try without manufacturer prefix
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  // Try model-only URL
  const modelUrl = `${BASE_URL}/yacht/${normalize(model)}/`;
  const specs2 = await fetchSailWikiYacht(modelUrl, fetchFn);
  if (specs2) return specs2;

  // Try with common variations
  const variants = [
    model.replace(/\./g, "-"),
    model.replace(/\s+/g, "-"),
    `${manufacturer} ${model}`.replace(/\s+/g, "-"),
  ];

  for (const variant of variants) {
    const url = `${BASE_URL}/yacht/${normalize(variant)}/`;
    const result = await fetchSailWikiYacht(url, fetchFn);
    if (result) return result;
    // Small delay between attempts
    await new Promise((r) => setTimeout(r, 500));
  }

  return null;
}

/** Check if a shipyard page exists and extract manufacturer info. */
export async function fetchSailWikiShipyard(
  manufacturer: string,
  fetchFn: typeof fetch = fetch,
): Promise<{
  exists: boolean;
  status?: "active" | "defunct" | "unknown";
  country?: string;
  yachtUrls: string[];
}> {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const url = `${BASE_URL}/shipyard/${normalize(manufacturer)}/`;

  try {
    const response = await fetchFn(url, {
      headers: {
        "User-Agent": "SailboatsFR-Bot/1.0 (contact@sailboats.fr)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { exists: false, yachtUrls: [] };
    }

    const html = await response.text();

    // Extract yacht model links from the shipyard page
    const yachtLinkRegex = /href="(https:\/\/sailwiki\.com\/yacht\/[^"]+)"/g;
    const yachtUrls: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = yachtLinkRegex.exec(html)) !== null) {
      if (!yachtUrls.includes(match[1])) {
        yachtUrls.push(match[1]);
      }
    }

    // Check for defunct/bankrupt/closed indicators
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    let status: "active" | "defunct" | "unknown" = "unknown";
    if (
      text.includes("defunct") ||
      text.includes("bankrupt") ||
      text.includes("ceased") ||
      text.includes("closed down") ||
      text.includes("liquidated") ||
      text.includes("out of business")
    ) {
      status = "defunct";
    } else if (
      text.includes("active") ||
      text.includes("currently") ||
      text.includes("ongoing")
    ) {
      status = "active";
    }

    return { exists: true, status, yachtUrls };
  } catch {
    return { exists: false, yachtUrls: [] };
  }
}
