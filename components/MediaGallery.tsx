"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Image as ImageIcon,
  PlayCircle,
  FileText,
  Layout,
  Map,
  RotateCcw,
  Box,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Download,
  Video,
} from "lucide-react";
import VideoEmbed from "@/components/VideoEmbed";
import { SHIMMER_BLUR } from "@/lib/image-utils";

export interface MediaAsset {
  id: number;
  mediaType: string;
  title: string | null;
  description: string | null;
  url: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  fileFormat: string | null;
  fileSize: number | null;
  caption: string | null;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface MediaGalleryProps {
  mediaAssets: MediaAsset[];
}

type TabKey = "photos" | "videos" | "brochures" | "more";

function groupByType(assets: MediaAsset[]) {
  const groups: Record<string, MediaAsset[]> = {};
  for (const a of assets) {
    const key = a.mediaType;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }
  return groups;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaGallery({ mediaAssets }: MediaGalleryProps) {
  const t = useTranslations("MediaGallery");
  const [activeTab, setActiveTab] = useState<TabKey>("photos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!mediaAssets || mediaAssets.length === 0) return null;

  const grouped = groupByType(mediaAssets);

  const photos = [
    ...(grouped["photo"] || []),
  ];
  const videos = [...(grouped["video"] || [])];
  const brochures = [
    ...(grouped["brochure"] || []),
    ...(grouped["deck_plan"] || []),
    ...(grouped["interior_layout"] || []),
  ];
  const more = [
    ...(grouped["360_tour"] || []),
    ...(grouped["3d_model"] || []),
  ];

  const tabCounts: Record<TabKey, number> = {
    photos: photos.length,
    videos: videos.length,
    brochures: brochures.length,
    more: more.length,
  };

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "photos", label: t("tabs.photos"), icon: <ImageIcon className="h-4 w-4" aria-hidden="true" /> },
    { key: "videos", label: t("tabs.videos"), icon: <PlayCircle className="h-4 w-4" aria-hidden="true" /> },
    { key: "brochures", label: t("tabs.brochures"), icon: <FileText className="h-4 w-4" aria-hidden="true" /> },
    { key: "more", label: t("tabs.more"), icon: <Box className="h-4 w-4" aria-hidden="true" /> },
  ];

  const currentLightboxPhotos = photos;
  const currentPhoto =
    lightboxIndex !== null ? currentLightboxPhotos[lightboxIndex] : null;

  // Available tabs (those with content or currently active)
  const availableTabs = TABS.filter(
    (tab) => tabCounts[tab.key] > 0 || tab.key === activeTab,
  );

  // Tab keyboard navigation handler
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = availableTabs.findIndex((tb) => tb.key === activeTab);
      if (currentIndex === -1) return;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % availableTabs.length;
        setActiveTab(availableTabs[nextIndex].key);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex =
          (currentIndex - 1 + availableTabs.length) % availableTabs.length;
        setActiveTab(availableTabs[prevIndex].key);
      } else if (e.key === "Home") {
        e.preventDefault();
        setActiveTab(availableTabs[0].key);
      } else if (e.key === "End") {
        e.preventDefault();
        setActiveTab(availableTabs[availableTabs.length - 1].key);
      }
    },
    [availableTabs, activeTab],
  );

  // Lightbox keyboard handler (Escape, ArrowLeft, ArrowRight)
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      if (e.key === "ArrowLeft" && lightboxIndex > 0) {
        e.preventDefault();
        setLightboxIndex(lightboxIndex - 1);
        return;
      }
      if (
        e.key === "ArrowRight" &&
        lightboxIndex < currentLightboxPhotos.length - 1
      ) {
        e.preventDefault();
        setLightboxIndex(lightboxIndex + 1);
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, currentLightboxPhotos.length, closeLightbox]);

  return (
    <section className="mt-10 sm:mt-12" data-testid="media-gallery">
      <h2 className="text-lg sm:text-xl font-bold mb-4">{t("heading")}</h2>

      {/* Tabs with keyboard navigation */}
      <div
        className="flex gap-1 border-b border-border mb-6 overflow-x-auto"
        role="tablist"
        data-testid="media-gallery-tabs"
        onKeyDown={handleTabKeyDown}
      >
        {availableTabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`media-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`media-tabpanel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            data-testid={`tab-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tabCounts[tab.key] > 0 && (
              <span className="ml-1 text-xs bg-muted rounded-full px-2 py-0.5">
                {tabCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        role="tabpanel"
        id={`media-tabpanel-${activeTab}`}
        aria-labelledby={`media-tab-${activeTab}`}
        data-testid={`tab-content-${activeTab}`}
      >
        {activeTab === "photos" && (
          <PhotoGrid
            photos={photos}
            onPhotoClick={(idx) => setLightboxIndex(idx)}
            primaryLabel={t("primary")}
          />
        )}
        {activeTab === "videos" && <VideoList videos={videos} />}
        {activeTab === "brochures" && <BrochureList items={brochures} />}
        {activeTab === "more" && <MoreList items={more} />}
      </div>

      {/* Lightbox */}
      {currentPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
          data-testid="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("lightbox.label")}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={closeLightbox}
            aria-label={t("lightbox.close")}
          >
            <X className="h-8 w-8" aria-hidden="true" />
          </button>
          {lightboxIndex != null && lightboxIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex! - 1);
              }}
              aria-label={t("lightbox.previous")}
            >
              <ChevronLeft className="h-10 w-10" aria-hidden="true" />
            </button>
          )}
          {lightboxIndex != null && lightboxIndex < currentLightboxPhotos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex! + 1);
              }}
              aria-label={t("lightbox.next")}
            >
              <ChevronRight className="h-10 w-10" aria-hidden="true" />
            </button>
          )}
          <div
            className="max-w-4xl max-h-[80vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentPhoto.url || currentPhoto.thumbnailUrl || ""}
              alt={
                currentPhoto.altText ||
                currentPhoto.title ||
                currentPhoto.caption ||
                t("photoAlt")
              }
              width={1200}
              height={800}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              placeholder="blur"
              blurDataURL={SHIMMER_BLUR}
              unoptimized
            />
            {(currentPhoto.title || currentPhoto.caption) && (
              <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                <p className="text-white text-sm">
                  {currentPhoto.title || currentPhoto.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PhotoGrid({
  photos,
  onPhotoClick,
  primaryLabel,
}: {
  photos: MediaAsset[];
  onPhotoClick: (idx: number) => void;
  primaryLabel: string;
}) {
  const t = useTranslations("MediaGallery");

  if (photos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="no-photos">
        {t("empty.photos")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map((photo, idx) => (
        <button
          key={photo.id}
          onClick={() => onPhotoClick(idx)}
          className="relative aspect-4/3 rounded-lg overflow-hidden bg-muted group cursor-pointer border border-border hover:border-primary transition-colors"
          data-testid="media-photo-thumb"
        >
          <Image
            src={photo.thumbnailUrl || photo.url || ""}
            alt={
              photo.altText || photo.title || photo.caption || t("photoAlt")
            }
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            placeholder="blur"
            blurDataURL={SHIMMER_BLUR}
          />
          {photo.isPrimary && (
            <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {primaryLabel}
            </span>
          )}
          {photo.title && (
            <span className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-2">
              <span className="text-white text-xs truncate block">
                {photo.title}
              </span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function VideoList({ videos }: { videos: MediaAsset[] }) {
  const t = useTranslations("MediaGallery");

  if (videos.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="no-videos">
        {t("empty.videos")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="border border-border rounded-lg overflow-hidden"
          data-testid="media-video-card"
        >
          {video.embedUrl ? (
            <VideoEmbed
              embedUrl={video.embedUrl}
              thumbnailUrl={video.thumbnailUrl}
              title={video.title || t("videoDefaultTitle")}
              altText={video.altText}
              playLabel={t("playVideo")}
            />
          ) : video.thumbnailUrl ? (
            <div className="aspect-video relative bg-muted">
              <Image
                src={video.thumbnailUrl}
                alt={video.altText || video.title || t("videoThumbnail")}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {video.url ? (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-black/50 rounded-full p-3 hover:bg-black/70 transition-colors"
                    aria-label={t("watchOnPlatform")}
                  >
                    <PlayCircle className="h-10 w-10 text-white" aria-hidden="true" />
                  </a>
                ) : (
                  <Video className="h-10 w-10 text-white/50" aria-hidden="true" />
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted flex items-center justify-center">
              <Video className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
          <div className="p-3">
            {video.title && (
              <h4 className="font-medium text-sm">{video.title}</h4>
            )}
            {video.caption && (
              <p className="text-xs text-muted-foreground mt-1">
                {video.caption}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BrochureList({ items }: { items: MediaAsset[] }) {
  const t = useTranslations("MediaGallery");

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="no-brochures">
        {t("empty.brochures")}
      </p>
    );
  }

  const typeIcons: Record<string, React.ReactNode> = {
    brochure: <FileText className="h-6 w-6" aria-hidden="true" />,
    deck_plan: <Map className="h-6 w-6" aria-hidden="true" />,
    interior_layout: <Layout className="h-6 w-6" aria-hidden="true" />,
  };

  const typeLabels: Record<string, string> = {
    brochure: t("typeLabels.brochure"),
    deck_plan: t("typeLabels.deckPlan"),
    interior_layout: t("typeLabels.interiorLayout"),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-border rounded-lg p-4 flex gap-4 items-start hover:bg-muted/50 transition-colors"
          data-testid="media-brochure-card"
        >
          <div className="shrink-0 text-primary">
            {typeIcons[item.mediaType] || <FileText className="h-6 w-6" aria-hidden="true" />}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate">
              {item.title || typeLabels[item.mediaType] || item.mediaType}
            </h4>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            {item.fileFormat && (
              <span className="inline-block text-xs bg-muted rounded px-2 py-0.5 mt-1">
                {item.fileFormat.toUpperCase()}
                {item.fileSize ? ` • ${formatFileSize(item.fileSize)}` : ""}
              </span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                {t("download")}
              </a>
            )}
            {item.sourceUrl && !item.url && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {t("viewSource")}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MoreList({ items }: { items: MediaAsset[] }) {
  const t = useTranslations("MediaGallery");

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground text-sm" data-testid="no-more">
        {t("empty.more")}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-border rounded-lg overflow-hidden"
          data-testid={`media-${item.mediaType}-card`}
        >
          {item.embedUrl ? (
            <div className="aspect-video">
              <iframe
                src={item.embedUrl}
                title={item.title || item.mediaType}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="aspect-video bg-muted flex flex-col items-center justify-center gap-2">
              {item.mediaType === "360_tour" ? (
                <RotateCcw className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              ) : (
                <Box className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="text-sm text-muted-foreground">
                {item.mediaType === "360_tour"
                  ? t("tour360")
                  : t("model3d")}
              </span>
            </div>
          )}
          <div className="p-3">
            <h4 className="font-medium text-sm">
              {item.title ||
                (item.mediaType === "360_tour"
                  ? t("tour360Title")
                  : t("model3dTitle"))}
            </h4>
            {item.caption && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.caption}
              </p>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                {t("open")}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
