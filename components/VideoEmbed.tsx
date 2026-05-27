"use client";

import { useState, useCallback } from "react";
import { PlayCircle, ExternalLink } from "lucide-react";

interface VideoEmbedProps {
  embedUrl: string;
  thumbnailUrl?: string | null;
  title: string;
  altText?: string | null;
  playLabel?: string;
}

/**
 * Click-to-play video embed.
 * Shows a thumbnail with a play button; loads the iframe only after the user clicks.
 * Supports YouTube and Vimeo embed URLs.
 */
export default function VideoEmbed({
  embedUrl,
  thumbnailUrl,
  title,
  altText,
  playLabel = "Play video",
}: VideoEmbedProps) {
  const [active, setActive] = useState(false);

  const handlePlay = useCallback(() => {
    setActive(true);
  }, []);

  // Derive a thumbnail from the embed URL if none provided
  const derivedThumbnail = thumbnailUrl || deriveThumbnail(embedUrl);

  if (active) {
    // Append autoplay param for immediate playback
    const autoplayUrl = appendAutoplay(embedUrl);
    return (
      <div className="aspect-video" data-testid="video-embed-iframe">
        <iframe
          src={autoplayUrl}
          title={title}
          className="w-full h-full rounded-t-lg"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="aspect-video relative w-full group cursor-pointer bg-muted rounded-t-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={playLabel}
      data-testid="video-embed-thumbnail"
    >
      {derivedThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={derivedThumbnail}
          alt={altText || title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <PlayCircle className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
        <div className="bg-white/90 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
          <PlayCircle className="h-10 w-10 text-primary" aria-hidden="true" />
        </div>
      </div>
    </button>
  );
}

/**
 * Try to derive a thumbnail URL from YouTube or Vimeo embed URLs.
 */
function deriveThumbnail(embedUrl: string): string | null {
  try {
    const url = new URL(embedUrl);
    const host = url.hostname;
    // Only derive thumbnails for YouTube
    if (host === "www.youtube.com" || host === "youtube.com" || host === "youtu.be") {
      const ytMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (ytMatch) {
        return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
      }
    }
    // Vimeo thumbnails require an API call; return null
    if (host === "player.vimeo.com" || host === "vimeo.com") {
      return null;
    }
  } catch {
    // Invalid URL
  }
  return null;
}

/**
 * Append autoplay=1 parameter to embed URL for immediate playback after click.
 */
function appendAutoplay(embedUrl: string): string {
  try {
    const url = new URL(embedUrl);
    if (!url.searchParams.has("autoplay")) {
      url.searchParams.set("autoplay", "1");
    }
    // YouTube needs mute for autoplay to work in most browsers
    if (embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be")) {
      url.searchParams.set("mute", "1");
    }
    return url.toString();
  } catch {
    return embedUrl;
  }
}
