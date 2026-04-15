/**
 * Revenue Analytics Event Tracking (P8.6)
 *
 * Client-side event tracking for monetization surfaces:
 * - Affiliate link clicks
 * - Lead form submissions
 * - Compare completions
 * - Price block engagement
 *
 * Events are batched and sent to /api/revenue-events for server-side logging.
 */

// --- Types ---

export type RevenueEventType =
  | "affiliate_click"
  | "lead_submit"
  | "compare_complete"
  | "price_block_view"
  | "price_block_click"
  | "inquiry_modal_open"
  | "guide_cta_click"
  | "export_download";

export interface RevenueEvent {
  type: RevenueEventType;
  page: string;
  source: string; // which component/section triggered it
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: number;
}

interface QueuedEvent extends RevenueEvent {
  sessionId: string;
}

// --- Session ID ---

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window === "undefined") return "server";

  // Try to reuse session from sessionStorage
  const stored = sessionStorage.getItem("_revenue_sid");
  if (stored) {
    sessionId = stored;
    return sessionId;
  }

  // Generate new session ID
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    sessionStorage.setItem("_revenue_sid", sessionId);
  } catch {
    // sessionStorage not available
  }
  return sessionId;
}

// --- Event Queue ---

const eventQueue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueEvent(event: RevenueEvent): void {
  if (typeof window === "undefined") return;

  const queued: QueuedEvent = {
    ...event,
    sessionId: getSessionId(),
    page: event.page || window.location.pathname,
    timestamp: event.timestamp || Date.now(),
  };

  eventQueue.push(queued);

  // Batch send — flush after 3 seconds of inactivity
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 3000);

  // Also flush immediately if queue is large
  if (eventQueue.length >= 10) {
    flushEvents();
  }
}

async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = eventQueue.splice(0, eventQueue.length);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    // Use sendBeacon for reliability, fallback to fetch
    const payload = JSON.stringify({ events });

    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/revenue-events", blob);
    } else {
      await fetch("/api/revenue-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
    }
  } catch {
    // Silently fail — analytics should never break the user experience
  }
}

// Flush on page hide/unload
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => flushEvents());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushEvents();
  });
}

// --- Public API ---

/**
 * Track an affiliate link click.
 */
export function trackAffiliateClick(data: {
  productId: string;
  productName: string;
  category: string;
  yachtId?: number;
  page?: string;
}): void {
  queueEvent({
    type: "affiliate_click",
    page: data.page || "",
    source: "affiliate_recommendation",
    metadata: {
      productId: data.productId,
      productName: data.productName,
      category: data.category,
      yachtId: data.yachtId ?? null,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track a lead/inquiry form submission.
 */
export function trackLeadSubmit(data: {
  leadType: string;
  yachtIds: number[];
  page?: string;
}): void {
  queueEvent({
    type: "lead_submit",
    page: data.page || "",
    source: "lead_form",
    metadata: {
      leadType: data.leadType,
      yachtIds: data.yachtIds.join(","),
      yachtCount: data.yachtIds.length,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track when a user completes a yacht comparison (views comparison results).
 */
export function trackCompareComplete(data: {
  yachtIds: number[];
  yachtSlugs?: string[];
  page?: string;
}): void {
  queueEvent({
    type: "compare_complete",
    page: data.page || "",
    source: "compare_page",
    metadata: {
      yachtIds: data.yachtIds.join(","),
      yachtSlugs: data.yachtSlugs?.join(",") ?? null,
      yachtCount: data.yachtIds.length,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track price block engagement (view or click).
 */
export function trackPriceBlockEngagement(data: {
  action: "view" | "click";
  yachtId: number;
  priceMin?: number;
  priceMax?: number;
  condition?: string;
  page?: string;
}): void {
  queueEvent({
    type: data.action === "view" ? "price_block_view" : "price_block_click",
    page: data.page || "",
    source: "price_block",
    metadata: {
      yachtId: data.yachtId,
      priceMin: data.priceMin ?? null,
      priceMax: data.priceMax ?? null,
      condition: data.condition ?? null,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track inquiry modal open.
 */
export function trackInquiryModalOpen(data: {
  yachtIds: number[];
  source: string;
  page?: string;
}): void {
  queueEvent({
    type: "inquiry_modal_open",
    page: data.page || "",
    source: data.source,
    metadata: {
      yachtIds: data.yachtIds.join(","),
      yachtCount: data.yachtIds.length,
    },
    timestamp: Date.now(),
  });
}

/**
 * Track a generic guide/CTA click.
 */
export function trackGuideCtaClick(data: {
  ctaType: string;
  targetUrl?: string;
  guideSlug?: string;
  page?: string;
}): void {
  queueEvent({
    type: "guide_cta_click",
    page: data.page || "",
    source: "guide_cta",
    metadata: {
      ctaType: data.ctaType,
      targetUrl: data.targetUrl ?? null,
      guideSlug: data.guideSlug ?? null,
    },
    timestamp: Date.now(),
  });
}

/**
 * Get the current session ID (useful for debugging).
 */
export function getAnalyticsSessionId(): string {
  return getSessionId();
}

/**
 * Track a comparison export download (CSV or PDF).
 */
export function trackExportDownload(data: {
  format: "csv" | "pdf";
  yachtIds: number[];
  page?: string;
}): void {
  queueEvent({
    type: "export_download",
    page: data.page || "",
    source: "compare_export",
    metadata: {
      format: data.format,
      yachtIds: data.yachtIds.join(","),
      yachtCount: data.yachtIds.length,
    },
    timestamp: Date.now(),
  });
}
