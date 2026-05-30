"use client";

import { useState } from "react";
import Image from "next/image";
import { SHIMMER_BLUR } from "@/lib/image-utils";

interface ManufacturerLogoProps {
  name: string;
  logoUrl: string | null;
  size?: number;
  className?: string;
}

/**
 * Reusable manufacturer logo component with SVG initial fallback.
 * Uses next/image for optimization when logo_url is available,
 * otherwise renders a colored circle with the brand initial.
 */
export default function ManufacturerLogo({
  name,
  logoUrl,
  size = 40,
  className = "",
}: ManufacturerLogoProps) {
  const [imgError, setImgError] = useState(false);
  const initial = name.charAt(0).toUpperCase();
  // Deterministic color from name
  const hue = hashStringToHue(name);

  if (logoUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-lg bg-gray-50 ${className}`}
        style={{ width: size, height: size }}
      >
        {!imgError ? (
          <Image
            src={logoUrl}
            alt={`${name} logo`}
            width={size}
            height={size}
            className="h-full w-full object-contain p-1"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-white font-bold"
            style={{
              backgroundColor: `hsl(${hue}, 55%, 45%)`,
              fontSize: size * 0.45,
            }}
          >
            {initial}
          </div>
        )}
      </div>
    );
  }

  // No logo URL — render SVG initial fallback
  return (
    <div
      className={`shrink-0 rounded-lg flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${hue}, 55%, 45%)`,
        fontSize: size * 0.45,
      }}
      aria-label={`${name} logo`}
    >
      {initial}
    </div>
  );
}

/** Deterministic hue from string (0-360) */
function hashStringToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}
