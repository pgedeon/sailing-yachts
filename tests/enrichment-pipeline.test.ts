import { describe, it, expect } from 'vitest'
import { parseBoatSpecsHtml, buildBoatSpecsUrl, extractMetricValue } from '../lib/enrichment/boat-specs-scraper'

describe('boat-specs-scraper', () => {
  describe('extractMetricValue', () => {
    it('extracts metric meters', () => {
      // Test via parsing which uses extractMetricValue internally
      const result = parseBoatSpecsHtml(
        mockHtmlWithLines('Hull length', `39' 10" 12.12 m`),
        'https://example.com'
      )
      expect(result.hullLength).toBe(12.12)
    })

    it('extracts metric kg', () => {
      const result = parseBoatSpecsHtml(
        mockHtmlWithLines('Light displacement (M LC )', `16001 lb 7258 kg`),
        'https://example.com'
      )
      expect(result.displacement).toBe(7258)
    })

    it('extracts HP values', () => {
      const result = parseBoatSpecsHtml(
        mockHtmlWithLines('Engine(s) power', '50 HP'),
        'https://example.com'
      )
      expect(result.enginePower).toBe(50)
    })
  })

  describe('parseBoatSpecsHtml', () => {
    it('parses full specs from realistic HTML', () => {
      const html = `
        <div>
          <div>Océanis 400 Deep draft Sailboat specifications</div>
          <div>Model</div>
          <div>Océanis 400</div>
          <div>Version</div>
          <div>Deep draft</div>
          <div>Hull type</div>
          <div>Monohull</div>
          <div>Category</div>
          <div>Cruising sailboat</div>
          <div>Sailboat builder</div>
          <div>Bénéteau</div>
          <div>Hull length</div>
          <div>39&#8217; 10&#8221; 12.12 m</div>
          <div>Beam (width)</div>
          <div>12&#8217; 10&#8221; 3.91 m</div>
          <div>Draft</div>
          <div>5&#8217; 6&#8221; 1.68 m</div>
          <div>Light displacement (M LC )</div>
          <div>16001 lb 7258 kg</div>
          <div>Ballast weight</div>
          <div>5600 lb 2540 kg</div>
          <div>Mainsail area</div>
          <div>377 ft² 35 m²</div>
          <div>Rigging type</div>
          <div>Sloop Marconi masthead</div>
          <div>Keel : L-shaped keel (with bulb)</div>
          <div>Engine(s) power</div>
          <div>50 HP</div>
          <div>Cabin(s) (min./max.)</div>
          <div>2 / 3</div>
          <div>Berth(s) (min./max.)</div>
          <div>4 / 8</div>
          <div>Freshwater tank capacity</div>
          <div>140 gal 530 liters</div>
          <div>First built hull</div>
          <div>1991</div>
          <div>Last built hull</div>
          <div>1997</div>
        </div>
      `

      const result = parseBoatSpecsHtml(html, 'https://www.boat-specs.com/sailing/sailboats/beneteau/oceanis-400-deep-draft')

      expect(result.sourceUrl).toBe('https://www.boat-specs.com/sailing/sailboats/beneteau/oceanis-400-deep-draft')
      expect(result.model).toBe('Océanis 400')
      expect(result.version).toBe('Deep draft')
      expect(result.hullType).toBe('Monohull')
      expect(result.category).toBe('Cruising sailboat')
      expect(result.manufacturer).toBe('Bénéteau')
      expect(result.hullLength).toBe(12.12)
      expect(result.beam).toBe(3.91)
      expect(result.draft).toBe(1.68)
      expect(result.displacement).toBe(7258)
      expect(result.ballast).toBe(2540)
      expect(result.mainsailArea).toBe(35)
      expect(result.riggingType).toBe('Sloop Marconi masthead')
      expect(result.keelType).toBe('L-shaped keel (with bulb)')
      expect(result.enginePower).toBe(50)
      expect(result.cabins).toBe(3)
      expect(result.berths).toBe(8)
      expect(result.waterTankCapacity).toBe(530)
      expect(result.firstBuilt).toBe(1991)
      expect(result.lastBuilt).toBe(1997)
    })

    it('handles empty or error pages gracefully', () => {
      const html = `
        <html>
          <head><title>The page does not exist</title></head>
          <body></body>
        </html>
      `
      const result = parseBoatSpecsHtml(html, 'https://example.com')
      expect(result.sourceUrl).toBe('https://example.com')
      expect(result.model).toBe('')
    })

    it('extracts metric values from mixed units', () => {
      const html = `
        <div>
          <div>Hull length</div>
          <div>39&#8217; 10&#8221; 12.12 m</div>
          <div>Light displacement (M LC )</div>
          <div>16001 lb 7258 kg</div>
        </div>
      `
      const result = parseBoatSpecsHtml(html, 'https://example.com')
      expect(result.hullLength).toBe(12.12)
      expect(result.displacement).toBe(7258)
    })
  })

  describe('buildBoatSpecsUrl', () => {
    it('builds correct URL for manufacturer and model', () => {
      expect(buildBoatSpecsUrl('Beneteau', 'Oceanis 40.1'))
        .toBe('https://www.boat-specs.com/sailing/sailboats/beneteau/oceanis-40-1')
    })

    it('handles special characters', () => {
      expect(buildBoatSpecsUrl("Oyster Yachts", "Oyster 545"))
        .toBe('https://www.boat-specs.com/sailing/sailboats/oyster-yachts/oyster-545')
    })

    it('lowercases and joins with hyphens', () => {
      expect(buildBoatSpecsUrl('X-Yachts', 'X-43'))
        .toBe('https://www.boat-specs.com/sailing/sailboats/x-yachts/x-43')
    })
  })
})

/**
 * Helper to create mock HTML with label/value pairs
 */
function mockHtmlWithLines(label: string, value: string): string {
  return `<div><div>${label}</div><div>${value}</div></div>`
}
