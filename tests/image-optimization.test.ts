import { describe, it, expect } from 'vitest'

// Load the raw next.config.js (before wrappers)
const fs = require('fs')
const path = require('path')

// We parse the config to extract the images section
// Since next.config.js uses module.exports with wrappers, we extract the raw config inline
function getRawImagesConfig() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'next.config.js'), 'utf-8')

  // Extract the imageRemotePatterns array
  const patternsMatch = content.match(/const imageRemotePatterns = \[([\s\S]*?)\];/)
  if (!patternsMatch) throw new Error('Could not find imageRemotePatterns in next.config.js')

  // Extract the images config object
  const imagesMatch = content.match(/images:\s*\{([^}]+)\}/g)
  if (!imagesMatch) throw new Error('Could not find images config in next.config.js')

  // Parse formats
  const formatsMatch = content.match(/formats:\s*\[([^\]]+)\]/)
  const formats = formatsMatch
    ? formatsMatch[1].split(',').map((s: string) => s.trim().replace(/["']/g, ''))
    : []

  // Parse deviceSizes
  const deviceSizesMatch = content.match(/deviceSizes:\s*\[([^\]]+)\]/)
  const deviceSizes = deviceSizesMatch
    ? deviceSizesMatch[1].split(',').map((s: string) => parseInt(s.trim(), 10))
    : []

  // Parse imageSizes
  const imageSizesMatch = content.match(/imageSizes:\s*\[([^\]]+)\]/)
  const imageSizes = imageSizesMatch
    ? imageSizesMatch[1].split(',').map((s: string) => parseInt(s.trim(), 10))
    : []

  // Count remote patterns by counting { protocol entries
  const patternBlocks = patternsMatch[1].match(/\{[^}]+\}/g) || []

  return { formats, deviceSizes, imageSizes, patternCount: patternBlocks.length, patternsRaw: patternsMatch[1] }
}

describe('Image optimization configuration', () => {
  const config = getRawImagesConfig()

  it('should have AVIF as the primary image format', () => {
    expect(config.formats[0]).toBe('image/avif')
  })

  it('should have WebP as the fallback format', () => {
    expect(config.formats[1]).toBe('image/webp')
  })

  it('should have at least 30 remote patterns for image sources', () => {
    expect(config.patternCount).toBeGreaterThanOrEqual(30)
  })

  it('should include key image sources', () => {
    const patterns = config.patternsRaw
    expect(patterns).toContain('images.unsplash.com')
    expect(patterns).toContain('images.boatsgroup.com')
    expect(patterns).toContain('www.boat-specs.com')
    expect(patterns).toContain('sailboatdata.com')
    expect(patterns).toContain('www.beneteau.com')
    expect(patterns).toContain('www.bavariayachts.com')
    expect(patterns).toContain('www.x-yachts.com')
  })

  it('should have device sizes optimized for yacht images', () => {
    expect(config.deviceSizes).toContain(640)
    expect(config.deviceSizes).toContain(1200)
    expect(config.deviceSizes).toContain(1920)
  })

  it('should have image sizes for thumbnails', () => {
    expect(config.imageSizes).toContain(96)
    expect(config.imageSizes).toContain(256)
  })

  it('should NOT use wildcard hostname pattern', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'next.config.js'), 'utf-8')
    expect(content).not.toMatch(/hostname:\s*['"]\*\*['"]/)
  })
})
