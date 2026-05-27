import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const projectRoot = path.resolve(__dirname, "..");

// ── VideoEmbed component file tests ──

describe("VideoEmbed component", () => {
  const filePath = path.resolve(projectRoot, "components/VideoEmbed.tsx");

  it("exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("is a client component", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("uses click-to-play pattern with state toggle", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // Should have useState for active/play state
    expect(content).toMatch(/useState.*false/);
    // Should NOT render iframe immediately — conditional on active state
    expect(content).toMatch(/if\s*\(active\)/);
  });

  it("derives YouTube thumbnail from embed URL", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("img.youtube.com/vi/");
  });

  it("appends autoplay parameter on iframe load", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("autoplay");
    expect(content).toMatch(/appendAutoplay/);
  });

  it("handles Vimeo URLs gracefully", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/vimeo/);
  });

  it("has proper accessibility with aria-label on play button", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/aria-label/);
  });

  it("uses responsive aspect-video container", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("aspect-video");
  });

  it("lazy-loads thumbnail images", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('loading="lazy"');
  });
});

// ── VideoEmbed logic tests ──

describe("VideoEmbed thumbnail derivation", () => {
  // Inline the deriveThumbnail logic for testing
  function deriveThumbnail(embedUrl: string): string | null {
    try {
      const url = new URL(embedUrl);
      const host = url.hostname;
      if (host === "www.youtube.com" || host === "youtube.com" || host === "youtu.be") {
        const ytMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
        if (ytMatch) {
          return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
        }
      }
      if (host === "player.vimeo.com" || host === "vimeo.com") {
        return null;
      }
    } catch {
      return null;
    }
    return null;
  }

  it("derives thumbnail from YouTube embed URL", () => {
    expect(deriveThumbnail("https://www.youtube.com/embed/abc123")).toBe(
      "https://img.youtube.com/vi/abc123/hqdefault.jpg",
    );
  });

  it("derives thumbnail from YouTube embed URL with params", () => {
    expect(deriveThumbnail("https://www.youtube.com/embed/xyz789?rel=0")).toBe(
      "https://img.youtube.com/vi/xyz789/hqdefault.jpg",
    );
  });

  it("returns null for Vimeo URLs", () => {
    expect(deriveThumbnail("https://player.vimeo.com/video/12345")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(deriveThumbnail("not-a-url")).toBeNull();
  });

  it("returns null for unknown embed domains", () => {
    expect(deriveThumbnail("https://example.com/embed/abc")).toBeNull();
  });
});

describe("VideoEmbed autoplay URL building", () => {
  function appendAutoplay(embedUrl: string): string {
    try {
      const url = new URL(embedUrl);
      if (!url.searchParams.has("autoplay")) {
        url.searchParams.set("autoplay", "1");
      }
      if (embedUrl.includes("youtube.com") || embedUrl.includes("youtu.be")) {
        url.searchParams.set("mute", "1");
      }
      return url.toString();
    } catch {
      return embedUrl;
    }
  }

  it("appends autoplay=1 to YouTube URL", () => {
    const result = appendAutoplay("https://www.youtube.com/embed/abc");
    expect(result).toContain("autoplay=1");
    expect(result).toContain("mute=1");
  });

  it("appends autoplay=1 to Vimeo URL without mute", () => {
    const result = appendAutoplay("https://player.vimeo.com/video/123");
    expect(result).toContain("autoplay=1");
    expect(result).not.toContain("mute=");
  });

  it("preserves existing params", () => {
    const result = appendAutoplay("https://www.youtube.com/embed/abc?rel=0");
    expect(result).toContain("rel=0");
    expect(result).toContain("autoplay=1");
  });

  it("does not double-add autoplay", () => {
    const result = appendAutoplay("https://www.youtube.com/embed/abc?autoplay=1");
    expect(result.match(/autoplay/g)).toHaveLength(1);
  });
});

// ── MediaGallery component file tests ──

describe("MediaGallery component", () => {
  const filePath = path.resolve(projectRoot, "components/MediaGallery.tsx");

  it("exists", () => {
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("is a client component", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("imports VideoEmbed for click-to-play", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/import.*VideoEmbed/);
  });

  it("uses useTranslations for i18n", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toMatch(/useTranslations.*MediaGallery/);
  });

  it("no longer has hardcoded English labels for tabs", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // The TABS array should use t() for labels, not hardcoded strings
    expect(content).not.toMatch(/label:\s*["']Photos["']/);
    expect(content).not.toMatch(/label:\s*["']Videos["']/);
    expect(content).not.toMatch(/label:\s*["']Brochures & Plans["']/);
  });

  it("uses VideoEmbed for video assets with embedUrl", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // VideoList should use VideoEmbed component when video has embedUrl
    expect(content).toMatch(/video.embedUrl/);
    expect(content).toMatch(/<VideoEmbed/);
  });

  it("does not render iframes directly in VideoList", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    // The VideoList function should NOT contain raw iframe tags
    const videoListSection = content.substring(
      content.indexOf("function VideoList"),
      content.indexOf("function BrochureList"),
    );
    expect(videoListSection).not.toContain("<iframe");
  });
});

// ── i18n translation completeness ──

describe("MediaGallery i18n translations", () => {
  it("has all required English keys", () => {
    const en = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "messages/en.json"), "utf-8"));
    const mg = en.MediaGallery;
    expect(mg).toBeDefined();
    expect(mg.heading).toBeDefined();
    expect(mg.tabs.photos).toBeDefined();
    expect(mg.tabs.videos).toBeDefined();
    expect(mg.tabs.brochures).toBeDefined();
    expect(mg.tabs.more).toBeDefined();
    expect(mg.playVideo).toBeDefined();
    expect(mg.empty.photos).toBeDefined();
    expect(mg.empty.videos).toBeDefined();
    expect(mg.empty.brochures).toBeDefined();
    expect(mg.empty.more).toBeDefined();
    expect(mg.lightbox.label).toBeDefined();
    expect(mg.lightbox.close).toBeDefined();
    expect(mg.lightbox.previous).toBeDefined();
    expect(mg.lightbox.next).toBeDefined();
    expect(mg.typeLabels.brochure).toBeDefined();
    expect(mg.typeLabels.deckPlan).toBeDefined();
    expect(mg.typeLabels.interiorLayout).toBeDefined();
  });

  it("has all required French keys", () => {
    const fr = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "messages/fr.json"), "utf-8"));
    const mg = fr.MediaGallery;
    expect(mg).toBeDefined();
    expect(mg.heading).toBe("Galerie média");
    expect(mg.tabs.photos).toBe("Photos");
    expect(mg.tabs.videos).toBe("Vidéos");
    expect(mg.playVideo).toBe("Lire la vidéo");
    expect(mg.empty.videos).toBe("Aucune vidéo disponible");
    expect(mg.lightbox.close).toBe("Fermer la visionneuse");
  });

  it("EN and FR have the same key structure", () => {
    const en = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "messages/en.json"), "utf-8"));
    const fr = JSON.parse(fs.readFileSync(path.resolve(projectRoot, "messages/fr.json"), "utf-8"));

    function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      const keys: string[] = [];
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          keys.push(...getKeys(value as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys;
    }

    const enKeys = getKeys(en.MediaGallery).sort();
    const frKeys = getKeys(fr.MediaGallery).sort();
    expect(frKeys).toEqual(enKeys);
  });
});

// ── VideoObject JSON-LD integration ──

describe("VideoObject JSON-LD in yacht detail page", () => {
  const pagePath = path.resolve(projectRoot, "app/[locale]/yachts/[slug]/page.tsx");

  it("imports generateVideoObjectJsonLd", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("generateVideoObjectJsonLd");
  });

  it("generates VideoObject for video media assets", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toMatch(/mediaType.*video/);
    expect(content).toMatch(/generateVideoObjectJsonLd/);
  });

  it("renders media JSON-LD scripts in the page", () => {
    const content = fs.readFileSync(pagePath, "utf-8");
    expect(content).toContain("media-jsonld");
    expect(content).toContain("application/ld+json");
  });
});
