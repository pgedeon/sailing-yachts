'use client'

import Image from 'next/image'
import { useState } from 'react'

// Compact shimmer blur placeholder (20x20 gray gradient)
const SHIMMER_BLUR = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true"><defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23e2e8f0"/><stop offset="50%" stop-color="%23cbd5e1"/><stop offset="100%" stop-color="%23e2e8f0"/></linearGradient></defs><rect width="20" height="20" fill="url(%23s)"/></svg>'
)

// Inline SVG fallback as data URI — always works, no file dependency
const FALLBACK_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
  '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="400" height="300" fill="%23f3f4f6"/><text x="200" y="155" text-anchor="middle" fill="%239ca3af" font-family="Arial,sans-serif" font-size="14">No image available</text></svg>'
)

interface YachtImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fallback?: string
  sizes?: string
  fill?: boolean
  quality?: number
}

export default function YachtImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fallback = FALLBACK_IMAGE,
  sizes,
  fill = false,
  quality = 80,
}: YachtImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      setImgSrc(fallback)
    }
  }

  if (fill) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          priority={priority}
          quality={quality}
          className="object-cover transition-opacity duration-300"
          onError={handleError}
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR}
          unoptimized={imgSrc.startsWith('data:')}
        />
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width || 400}
        height={height || 300}
        sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
        priority={priority}
        quality={quality}
        className="object-cover transition-opacity duration-300"
        onError={handleError}
        placeholder="blur"
        blurDataURL={SHIMMER_BLUR}
        unoptimized={imgSrc.startsWith('data:')}
      />
    </div>
  )
}

interface YachtImageData {
  url: string
  caption?: string
  altText?: string
  isPrimary: boolean
  sortOrder: number
}

interface YachtImageGalleryProps {
  images: YachtImageData[]
  className?: string
}

export function YachtImageGallery({ images, className = '' }: YachtImageGalleryProps) {
  if (images.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No images available</p>
        </div>
      </div>
    )
  }

  // Sort images by sortOrder and mark primary image
  const sortedImages = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return a.sortOrder - b.sortOrder
  })

  const primaryImage = sortedImages.find(img => img.isPrimary) || sortedImages[0]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Image */}
      <div className="relative">
        <YachtImage
          src={primaryImage.url}
          alt={primaryImage.altText || 'Primary yacht image'}
          fill
          className="w-full h-64 sm:h-80 md:h-96 rounded-lg"
          priority={true}
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {primaryImage.caption && (
          <p className="mt-2 text-sm text-gray-600">{primaryImage.caption}</p>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sortedImages.map((image, index) => (
            <div key={image.url} className="relative h-24">
              <YachtImage
                src={image.url}
                alt={image.altText || `Yacht image ${index + 1}`}
                fill
                className="w-full h-full rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                sizes="(max-width: 768px) 50vw, 200px"
              />
              {image.isPrimary && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
