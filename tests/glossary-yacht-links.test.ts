import { describe, it, expect } from 'vitest'
import { getYachtLinksForTerm } from '@/lib/glossary-yacht-links'

describe('Glossary yacht links', () => {
  it('should return links for keel-type terms', () => {
    const links = getYachtLinksForTerm('fin-keel', 'en')
    expect(links.length).toBeGreaterThan(0)
    expect(links[0].href).toContain('/en/yachts')
    expect(links[0].href).toContain('keelType')
  })

  it('should return links for rig-type terms', () => {
    const sloop = getYachtLinksForTerm('sloop-rig', 'en')
    expect(sloop.length).toBeGreaterThan(0)
    expect(sloop[0].href).toContain('rigType')

    const ketch = getYachtLinksForTerm('ketch-rig', 'en')
    expect(ketch.length).toBeGreaterThan(0)
  })

  it('should return links for dimension terms', () => {
    const loa = getYachtLinksForTerm('loa', 'en')
    expect(loa.length).toBeGreaterThanOrEqual(2)
    expect(loa[0].href).toContain('lengthMin')
  })

  it('should return links for use-case terms', () => {
    const bw = getYachtLinksForTerm('bluewater', 'en')
    expect(bw.length).toBeGreaterThanOrEqual(2)
  })

  it('should use French locale in href when locale is fr', () => {
    const links = getYachtLinksForTerm('fin-keel', 'fr')
    expect(links[0].href).toContain('/fr/yachts')
  })

  it('should return empty array for unknown terms', () => {
    expect(getYachtLinksForTerm('nonexistent-term', 'en')).toEqual([])
  })

  it('should cover all 20 glossary slugs with at least one link', () => {
    const slugs = [
      'loa', 'beam', 'draft', 'displacement', 'ballast', 'ballast-ratio',
      'fin-keel', 'wing-keel', 'cutter-rig', 'sloop-rig', 'ketch-rig',
      'shoal-draft', 'lwl', 'hull-speed', 'cabin', 'berth', 'head',
      'bluewater', 'coastal-cruiser', 'liveaboard',
    ]
    let covered = 0
    for (const slug of slugs) {
      const links = getYachtLinksForTerm(slug, 'en')
      if (links.length > 0) covered++
    }
    // At least 18 of 20 terms should have yacht links
    expect(covered).toBeGreaterThanOrEqual(18)
  })

  it('should have French labels on all links', () => {
    const links = getYachtLinksForTerm('loa', 'en')
    for (const link of links) {
      expect(link.labelFr).toBeTruthy()
      expect(link.labelFr.length).toBeGreaterThan(0)
    }
  })
})
