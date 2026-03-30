'use client'

import Image from 'next/image'
import { useState } from 'react'

interface YachtImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fallback?: string
}

export default function YachtImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  fallback = '/placeholder-yacht.jpg'
}: YachtImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)

  const handleError = () => {
    setImgSrc(fallback)
    setIsLoading(false)
  }

  return (
    <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200' : ''} ${className}`}>
      <Image
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzAwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkeD0iMCUiIGZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkhvbWU8L3RleHQ+PC9zdmc+"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
}

interface YachtImageGalleryProps {
  images: Array<{
    url: string
    caption?: string
    altText?: string
    isPrimary: boolean
    sortOrder: number
  }>
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
          width={800}
          height={600}
          priority={true}
          className="w-full rounded-lg"
        />
        {primaryImage.caption && (
          <p className="mt-2 text-sm text-gray-600">{primaryImage.caption}</p>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {sortedImages.map((image, index) => (
            <div key={image.url} className="relative">
              <YachtImage
                src={image.url}
                alt={image.altText || `Yacht image ${index + 1}`}
                width={150}
                height={100}
                className="w-full rounded-md cursor-pointer hover:opacity-80 transition-opacity"
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