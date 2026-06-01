/**
 * P21.2: Boat-Specs.com scraper for data enrichment
 *
 * Fetches yacht specifications from boat-specs.com public pages.
 * Respects robots.txt (only scrapes allowed paths).
 * Rate limiting built in.
 */

const BASE_URL = 'https://www.boat-specs.com'

export interface ScrapedSpecs {
  sourceUrl: string
  manufacturer: string
  model: string
  version?: string
  hullLength?: number
  waterlineLength?: number
  beam?: number
  draft?: number
  mastHeight?: number
  displacement?: number
  ballast?: number
  ballastType?: string
  upwindSailArea?: number
  mainsailArea?: number
  genoaArea?: number
  riggingType?: string
  enginePower?: number
  fuelType?: string
  fuelTankCapacity?: number
  cabins?: number
  berths?: number
  heads?: number
  waterTankCapacity?: number
  maxHeadroom?: number
  keelType?: string
  hullType?: string
  category?: string
  construction?: string
  firstBuilt?: number
  lastBuilt?: number
}

/**
 * Extract metric value from mixed imperial/metric text like "39' 10\" 12.12 m"
 */
function extractMetricValue(text: string): number | undefined {
  // Match metric: "12.12 m" or "7258 kg" or "82 m²" or "50 HP" or "150 liters"
  const metricMatch = text.match(/([\d.]+)\s*(m|kg|m²|HP|liters?)\b/)
  if (metricMatch) return parseFloat(metricMatch[1])

  // Match "X / Y" pattern for cabins/berths like "2 / 3"
  const rangeMatch = text.match(/^(\d+)\s*\/\s*(\d+)$/)
  if (rangeMatch) return parseInt(rangeMatch[2]) // use max

  // Match simple number for counts
  const simpleNum = text.match(/^(\d+)$/)
  if (simpleNum) return parseInt(simpleNum[1])

  return undefined
}

/**
 * Extract year from text
 */
function extractYear(text: string): number | undefined {
  const match = text.match(/\b(19|20)\d{2}\b/)
  return match ? parseInt(match[0]) : undefined
}

/**
 * Parse HTML from boat-specs.com and extract structured specs
 */
export function parseBoatSpecsHtml(html: string, sourceUrl: string): ScrapedSpecs {
  const specs: ScrapedSpecs = { sourceUrl, manufacturer: '', model: '' }

  // Clean HTML entities
  const clean = html
    .replace(/&#8217;/g, "'")
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '-')
    .replace(/&amp;/g, '&')
    .replace(/&#178;/g, '²')

  // Extract all div content
  const divRegex = /<div[^>]*?>([\s\S]*?)<\/div>/g
  const divContents: string[] = []
  let match: RegExpExecArray | null
  while ((match = divRegex.exec(clean)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text && text.length > 1 && text.length < 500) {
      divContents.push(text)
    }
  }

  // Join all text for pattern matching
  const fullText = divContents.join('\n')

  // Extract manufacturer and model from breadcrumb/title
  const titleMatch = fullText.match(/(\w[\w\s.-]+?)\s*\([^)]*?\)\s*-\s*Sailboat specifications/)
  if (titleMatch) {
    const parts = titleMatch[1].trim().split(/\s+/)
    // Usually "Model Version (Manufacturer)"
  }

  // Parse specs from full text using patterns
  const lines = fullText.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : ''

    // Model
    if (line === 'Model' && nextLine) specs.model = nextLine
    // Version
    if (line === 'Version' && nextLine) specs.version = nextLine
    // Hull type
    if (line === 'Hull type' && nextLine) specs.hullType = nextLine
    // Category
    if (line === 'Category' && nextLine) specs.category = nextLine
    // Sailboat builder
    if (line === 'Sailboat builder' && nextLine) specs.manufacturer = nextLine
    // Construction
    if (line === 'Construction' && nextLine) specs.construction = nextLine
    // First built hull
    if (line === 'First built hull' && nextLine) specs.firstBuilt = extractYear(nextLine)
    // Last built hull
    if (line === 'Last built hull' && nextLine) specs.lastBuilt = extractYear(nextLine)
    // Appendages / Keel type
    if (line.startsWith('Keel') && line.includes(':')) {
      specs.keelType = line.replace(/^Keel\s*:\s*/, '').trim()
    }

    // Hull length
    if (line === 'Hull length' && nextLine) {
      specs.hullLength = extractMetricValue(nextLine)
    }
    // Waterline length
    if (line === 'Waterline length' && nextLine) {
      specs.waterlineLength = extractMetricValue(nextLine)
    }
    // Beam
    if (line === 'Beam (width)' && nextLine) {
      specs.beam = extractMetricValue(nextLine)
    }
    // Draft
    if (line === 'Draft' && nextLine) {
      specs.draft = extractMetricValue(nextLine)
    }
    // Mast height
    if (line === 'Mast height from D WL' && nextLine) {
      specs.mastHeight = extractMetricValue(nextLine)
    }
    // Displacement
    if (line.match(/^Light displacement/) && nextLine) {
      specs.displacement = extractMetricValue(nextLine)
    }
    // Ballast weight
    if (line === 'Ballast weight' && nextLine) {
      specs.ballast = extractMetricValue(nextLine)
    }
    // Ballast type
    if (line === 'Ballast type' && nextLine) {
      specs.ballastType = nextLine
    }
    // Upwind sail area
    if (line === 'Upwind sail area' && nextLine) {
      specs.upwindSailArea = extractMetricValue(nextLine)
    }
    // Mainsail area
    if (line === 'Mainsail area' && nextLine) {
      specs.mainsailArea = extractMetricValue(nextLine)
    }
    // Genoa area
    if (line === 'Genoa area' && nextLine) {
      specs.genoaArea = extractMetricValue(nextLine)
    }
    // Rigging type
    if (line === 'Rigging type' && nextLine) {
      specs.riggingType = nextLine
    }
    // Engine power
    if (line === 'Engine(s) power' && nextLine) {
      specs.enginePower = extractMetricValue(nextLine)
    }
    // Fuel type
    if (line === 'Fuel type' && nextLine) {
      specs.fuelType = nextLine
    }
    // Fuel tank
    if (line === 'Fuel tank capacity' && nextLine) {
      specs.fuelTankCapacity = extractMetricValue(nextLine)
    }
    // Cabins
    if (line === 'Cabin(s) (min./max.)' && nextLine) {
      const maxMatch = nextLine.match(/(\d+)\s*\/\s*(\d+)/)
      if (maxMatch) specs.cabins = parseInt(maxMatch[2])
      else specs.cabins = extractMetricValue(nextLine)
    }
    // Berths
    if (line === 'Berth(s) (min./max.)' && nextLine) {
      const maxMatch = nextLine.match(/(\d+)\s*\/\s*(\d+)/)
      if (maxMatch) specs.berths = parseInt(maxMatch[2])
      else specs.berths = extractMetricValue(nextLine)
    }
    // Heads
    if (line === 'Head(s)' && nextLine) {
      specs.heads = extractMetricValue(nextLine)
    }
    // Water tank
    if (line === 'Freshwater tank capacity' && nextLine) {
      specs.waterTankCapacity = extractMetricValue(nextLine)
    }
    // Max headroom
    if (line === 'Maximum headroom' && nextLine) {
      specs.maxHeadroom = extractMetricValue(nextLine)
    }
  }

  return specs
}

/**
 * Search for a yacht on boat-specs.com and return matching URLs
 */
export async function searchBoatSpecs(
  manufacturer: string,
  model: string,
  fetchFn: typeof fetch = fetch
): Promise<string[]> {
  const searchUrl = `${BASE_URL}/m/g.php?l=en&q=${encodeURIComponent(model)}&c=sailboats`

  const response = await fetchFn(searchUrl, {
    headers: {
      'User-Agent': 'SailboatsFR/1.0 (contact@sailboats.fr)',
      Accept: 'text/html',
    },
  })

  if (!response.ok) return []

  const html = await response.text()
  // Extract links from search results
  const linkRegex = /href="(\/sailing\/sailboats\/[^"]+)"/g
  const urls: string[] = []
  let match: RegExpExecArray | null
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    // Filter to matches containing manufacturer or model keywords
    if (
      url.toLowerCase().includes(manufacturer.toLowerCase().replace(/\s+/g, '-')) ||
      url.toLowerCase().includes(model.toLowerCase().replace(/\s+/g, '-'))
    ) {
      urls.push(`${BASE_URL}${url}`)
    }
  }

  return [...new Set(urls)]
}

/**
 * Fetch and parse specs for a specific yacht from boat-specs.com
 */
export async function fetchBoatSpecs(
  url: string,
  fetchFn: typeof fetch = fetch
): Promise<ScrapedSpecs | null> {
  const response = await fetchFn(url, {
    headers: {
      'User-Agent': 'SailboatsFR/1.0 (contact@sailboats.fr)',
      Accept: 'text/html',
    },
  })

  if (!response.ok) return null

  const html = await response.text()

  // Check if page is an error page
  if (html.includes('The page does not exist') || html.includes('Error !')) {
    return null
  }

  return parseBoatSpecsHtml(html, url)
}

/**
 * Build a boat-specs.com URL from manufacturer and model name
 */
export function buildBoatSpecsUrl(manufacturer: string, model: string): string {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return `${BASE_URL}/sailing/sailboats/${normalize(manufacturer)}/${normalize(model)}`
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
