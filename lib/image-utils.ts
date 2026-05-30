/**
 * Shared image utilities for Next.js Image optimization.
 */

// Compact shimmer blur placeholder (20x20 gray gradient)
export const SHIMMER_BLUR =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="50%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%23e2e8f0"/></linearGradient></defs><rect width="20" height="20" fill="url(%23s)"/></svg>'
  )

// Inline SVG fallback as data URI — always works, no file dependency
export const FALLBACK_IMAGE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="155" text-anchor="middle" fill="%239ca3af" font-family="Arial,sans-serif" font-size="14">No image available</text></svg>'
  )
