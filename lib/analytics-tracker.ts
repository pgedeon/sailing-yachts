/**
 * P24.1 — Client-Side Analytics Tracker
 *
 * Lightweight client-side module for tracking user behavior events.
 * Batches events and sends them to /api/analytics for server-side storage.
 * No PII collected — session IDs are random and anonymous.
 *
 * Event types: page_view, yacht_view, search, compare, manufacturer_view,
 *              guide_view, cta_click, share, filter_use, rating, email_yacht, featured_view
 */

export type AnalyticsEventType =
  | "page_view"
  | "search"
  | "compare"
  | "yacht_view"
  | "manufacturer_view"
  | "guide_view"
  | "cta_click"
  | "share"
  | "filter_use"
  | "rating"
  | "email_yacht"
  | "featured_view";

interface TrackEvent {
  eventType: AnalyticsEventType;
  page: string;
  entityId?: number;
  entityType?: "yacht" | "manufacturer" | "guide" | "comparison";
  metadata?: Record<string, unknown>;
}

interface QueuedTrackEvent extends TrackEvent {
  sessionId: string;
  referrer: string;
  timestamp: number;
}

// ─── Session Management ──────────────────────────────────────────

let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  if (typeof window === "undefined") return "server";

  // Reuse session from sessionStorage
  const stored = sessionStorage.getItem("_analytics_sid");
  if (stored) {
    _sessionId = stored;
    return _sessionId;
  }

  // Generate new anonymous session ID
  _sessionId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    sessionStorage.setItem("_analytics_sid", _sessionId);
  } catch {
    // sessionStorage unavailable
  }
  return _sessionId;
}

// ─── Event Queue & Batching ──────────────────────────────────────

const queue: QueuedTrackEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueEvent(event: TrackEvent): void {
  if (typeof window === "undefined") return;

  // Respect Do Not Track
  if (navigator.doNotTrack === "1") return;

  const queued: QueuedTrackEvent = {
    ...event,
    sessionId: getSessionId(),
    referrer: document.referrer || "",
    page: event.page || window.location.pathname,
    timestamp: Date.now(),
  };

  queue.push(queued);

  // Batch send — flush after 3 seconds of inactivity
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushQueue, 3000);

  // Flush immediately if queue is large
  if (queue.length >= 10) {
    flushQueue();
  }
}

async function flushQueue(): Promise<void> {
  if (queue.length === 0) return;

  const events = queue.splice(0, queue.length);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    const payload = JSON.stringify({ events });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("https://api.sailboats.fr/analytics", blob);
    } else {
      await fetch("https://api.sailboats.fr/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Silently fail — analytics should never break UX
  }
}

// Flush on page hide/unload
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushQueue();
  });
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Track a page view. Call this from route-level layouts or pages.
 */
export function trackPageView(data?: {
  page?: string;
  entityId?: number;
  entityType?: "yacht" | "manufacturer" | "guide";
}): void {
  queueEvent({
    eventType: "page_view",
    page: data?.page || (typeof window !== "undefined" ? window.location.pathname : "/"),
    entityId: data?.entityId,
    entityType: data?.entityType,
  });
}

/**
 * Track a yacht detail page view.
 */
export function trackYachtView(data: {
  yachtId: number;
  yachtSlug: string;
  yachtName: string;
  manufacturerName?: string;
}): void {
  queueEvent({
    eventType: "yacht_view",
    page: `/yachts/${data.yachtSlug}`,
    entityId: data.yachtId,
    entityType: "yacht",
    metadata: {
      yachtName: data.yachtName,
      manufacturerName: data.manufacturerName,
    },
  });
}

/**
 * Track a manufacturer page view.
 */
export function trackManufacturerView(data: {
  manufacturerId: number;
  manufacturerSlug: string;
  manufacturerName: string;
}): void {
  queueEvent({
    eventType: "manufacturer_view",
    page: `/manufacturers/${data.manufacturerSlug}`,
    entityId: data.manufacturerId,
    entityType: "manufacturer",
    metadata: { manufacturerName: data.manufacturerName },
  });
}

/**
 * Track a search query.
 */
export function trackSearch(data: {
  query: string;
  resultCount: number;
  filters?: Record<string, unknown>;
}): void {
  queueEvent({
    eventType: "search",
    page: "/search",
    metadata: {
      query: data.query,
      resultCount: data.resultCount,
      filters: data.filters,
    },
  });
}

/**
 * Track a comparison action.
 */
export function trackCompare(data: {
  yachtIds: number[];
  yachtNames?: string[];
  yachtSlugs?: string[];
}): void {
  queueEvent({
    eventType: "compare",
    page: "/compare",
    entityType: "comparison",
    metadata: {
      yachtIds: data.yachtIds,
      yachtNames: data.yachtNames,
      yachtSlugs: data.yachtSlugs,
      yachtCount: data.yachtIds.length,
    },
  });
}

/**
 * Track a CTA (call-to-action) click.
 */
export function trackCtaClick(data: {
  ctaType: string;
  targetUrl?: string;
  page?: string;
}): void {
  queueEvent({
    eventType: "cta_click",
    page: data.page || "",
    metadata: {
      ctaType: data.ctaType,
      targetUrl: data.targetUrl,
    },
  });
}

/**
 * Track a social share action.
 */
export function trackShare(data: {
  platform: string;
  contentType: string;
  contentId?: number;
  page?: string;
}): void {
  queueEvent({
    eventType: "share",
    page: data.page || "",
    entityId: data.contentId,
    metadata: {
      platform: data.platform,
      contentType: data.contentType,
    },
  });
}

/**
 * Track filter usage.
 */
export function trackFilterUse(data: {
  filters: Record<string, unknown>;
  resultCount: number;
  page?: string;
}): void {
  queueEvent({
    eventType: "filter_use",
    page: data.page || "/yachts",
    metadata: {
      filters: data.filters,
      resultCount: data.resultCount,
    },
  });
}

/**
 * Track a featured yacht view.
 */
export function trackFeaturedView(data: {
  yachtId: number;
  yachtName: string;
}): void {
  queueEvent({
    eventType: "featured_view",
    page: "/yacht-of-the-week",
    entityId: data.yachtId,
    entityType: "yacht",
    metadata: { yachtName: data.yachtName },
  });
}

/**
 * Track email yacht action.
 */
export function trackEmailYacht(data: {
  yachtId: number;
  yachtName: string;
}): void {
  queueEvent({
    eventType: "email_yacht",
    page: `/yachts/${data.yachtName}`,
    entityId: data.yachtId,
    entityType: "yacht",
    metadata: { yachtName: data.yachtName },
  });
}

/**
 * Track a guide page view.
 */
export function trackGuideView(data: {
  guideSlug: string;
  guideTitle?: string;
}): void {
  queueEvent({
    eventType: "guide_view",
    page: `/guides/${data.guideSlug}`,
    metadata: { guideTitle: data.guideTitle },
  });
}

/**
 * Get the current analytics session ID (for debugging).
 */
export function getAnalyticsSessionId(): string {
  return getSessionId();
}
