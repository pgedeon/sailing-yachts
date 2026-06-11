/**
 * P26.1: Premium listing tier utilities
 * Feature gating logic for manufacturer premium tiers
 */

export type ManufacturerTier = 'free' | 'verified' | 'premium'

export interface PremiumManufacturer {
  tier: string | null
  verifiedAt: string | null
  premiumVideoUrl: string | null
  premiumDocuments: Array<{ title: string; url: string; type: string }> | null
  premiumTagline: string | null
  premiumFeaturedSince: string | null
  premiumCtaText: string | null
  premiumCtaUrl: string | null
}

/**
 * Check if manufacturer has a verified or premium tier
 */
export function isVerified(manufacturer: PremiumManufacturer): boolean {
  return manufacturer.tier === 'verified' || manufacturer.tier === 'premium'
}

/**
 * Check if manufacturer has premium tier features enabled
 */
export function isPremium(manufacturer: PremiumManufacturer): boolean {
  return manufacturer.tier === 'premium'
}

/**
 * Check if manufacturer should show video embed
 * Only premium tier with a video URL
 */
export function shouldShowVideo(manufacturer: PremiumManufacturer): boolean {
  return isPremium(manufacturer) && !!manufacturer.premiumVideoUrl
}

/**
 * Check if manufacturer should show documents
 * Only premium tier with documents
 */
export function shouldShowDocuments(manufacturer: PremiumManufacturer): boolean {
  return (
    isPremium(manufacturer) &&
    !!manufacturer.premiumDocuments &&
    manufacturer.premiumDocuments.length > 0
  )
}

/**
 * Check if manufacturer should show CTA button
 * Only premium tier with CTA text and URL
 */
export function shouldShowCta(manufacturer: PremiumManufacturer): boolean {
  return (
    isPremium(manufacturer) &&
    !!manufacturer.premiumCtaText &&
    !!manufacturer.premiumCtaUrl
  )
}

/**
 * Get available premium features for a manufacturer
 */
export function getPremiumFeatures(manufacturer: PremiumManufacturer): {
  verifiedBadge: boolean
  video: boolean
  documents: boolean
  tagline: boolean
  cta: boolean
} {
  return {
    verifiedBadge: isVerified(manufacturer),
    video: shouldShowVideo(manufacturer),
    documents: shouldShowDocuments(manufacturer),
    tagline: isPremium(manufacturer) && !!manufacturer.premiumTagline,
    cta: shouldShowCta(manufacturer),
  }
}
