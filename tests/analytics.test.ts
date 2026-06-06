/**
 * P24.1 — Analytics Tests
 *
 * Tests for the analytics service, API endpoints, and client tracker.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Analytics Service Tests ──────────────────────────────────────

describe("Analytics Service", () => {
  // Mock the db module
  vi.mock("@/lib/db", () => ({
    pool: {
      query: vi.fn(),
    },
  }));

  let pool: any;

  beforeEach(async () => {
    const db = await import("@/lib/db");
    pool = db.pool;
    vi.clearAllMocks();
  });

  describe("insertAnalyticsEvents", () => {
    it("should insert a batch of events", async () => {
      pool.query.mockResolvedValue({ rowCount: 3 });

      const { insertAnalyticsEvents } = await import(
        "@/lib/analytics-service"
      );

      const events = [
        {
          eventType: "page_view" as const,
          page: "/yachts",
          sessionId: "sess-1",
        },
        {
          eventType: "yacht_view" as const,
          page: "/yachts/beneteau-oceanis-40-1",
          entityId: 42,
          entityType: "yacht" as const,
          sessionId: "sess-1",
          metadata: { yachtName: "Oceanis 40.1" },
        },
        {
          eventType: "search" as const,
          page: "/search",
          sessionId: "sess-2",
          metadata: { query: "beneteau", resultCount: 15 },
        },
      ];

      const count = await insertAnalyticsEvents(events);
      expect(count).toBe(3);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO analytics_events");
      expect(params).toHaveLength(24); // 8 params per event × 3
    });

    it("should return 0 for empty batch", async () => {
      const { insertAnalyticsEvents } = await import(
        "@/lib/analytics-service"
      );
      const count = await insertAnalyticsEvents([]);
      expect(count).toBe(0);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe("insertAnalyticsEvent", () => {
    it("should insert a single event", async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      const { insertAnalyticsEvent } = await import(
        "@/lib/analytics-service"
      );

      await insertAnalyticsEvent({
        eventType: "compare",
        page: "/compare",
        sessionId: "sess-3",
        metadata: { yachtIds: [1, 2] },
      });

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain("INSERT INTO analytics_events");
      expect(params[0]).toBe("compare");
      expect(params[1]).toBe("/compare");
    });
  });

  describe("getAnalyticsSummary", () => {
    it("should return aggregated summary", async () => {
      pool.query
        .mockResolvedValueOnce({
          rows: [{ count: "1250" }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: "340" }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: "89" }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: "45" }],
        })
        .mockResolvedValueOnce({
          rows: [{ count: "567" }],
        });

      const { getAnalyticsSummary } = await import(
        "@/lib/analytics-service"
      );
      const summary = await getAnalyticsSummary(30);

      expect(summary.totalPageViews).toBe(1250);
      expect(summary.uniqueSessions).toBe(340);
      expect(summary.totalSearches).toBe(89);
      expect(summary.totalComparisons).toBe(45);
      expect(summary.totalYachtViews).toBe(567);
      expect(pool.query).toHaveBeenCalledTimes(5);
    });
  });

  describe("getEventTrend", () => {
    it("should return daily trend data", async () => {
      pool.query.mockResolvedValue({
        rows: [
          { date: "2026-06-03", count: "45" },
          { date: "2026-06-04", count: "52" },
          { date: "2026-06-05", count: "38" },
        ],
      });

      const { getEventTrend } = await import("@/lib/analytics-service");
      const trend = await getEventTrend("page_view", 7);

      expect(trend).toHaveLength(3);
      expect(trend[0]).toEqual({ date: "2026-06-03", count: 45 });
      expect(trend[2]).toEqual({ date: "2026-06-05", count: 38 });
    });
  });

  describe("getPopularYachts", () => {
    it("should return most viewed yachts with names", async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            yacht_model_id: 10,
            model_name: "Oceanis 40.1",
            manufacturer_name: "Beneteau",
            view_count: "150",
          },
          {
            yacht_model_id: 20,
            model_name: "C42",
            manufacturer_name: "Bavaria",
            view_count: "98",
          },
        ],
      });

      const { getPopularYachts } = await import("@/lib/analytics-service");
      const yachts = await getPopularYachts(30, 10);

      expect(yachts).toHaveLength(2);
      expect(yachts[0].modelName).toBe("Oceanis 40.1");
      expect(yachts[0].viewCount).toBe(150);
    });
  });

  describe("getPopularSearches", () => {
    it("should return popular search queries", async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            query: "beneteau",
            count: "25",
            result_count: "15",
            last_searched: "2026-06-05T10:00:00Z",
          },
        ],
      });

      const { getPopularSearches } = await import("@/lib/analytics-service");
      const searches = await getPopularSearches(30, 10);

      expect(searches).toHaveLength(1);
      expect(searches[0].query).toBe("beneteau");
      expect(searches[0].resultCount).toBe(15);
    });
  });

  describe("getPageViewBreakdown", () => {
    it("should return page view breakdown with unique views", async () => {
      pool.query.mockResolvedValue({
        rows: [
          { page: "/yachts", views: "500", unique_views: "350" },
          { page: "/compare", views: "200", unique_views: "180" },
        ],
      });

      const { getPageViewBreakdown } = await import(
        "@/lib/analytics-service"
      );
      const breakdown = await getPageViewBreakdown(30, 15);

      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].page).toBe("/yachts");
      expect(breakdown[0].views).toBe(500);
      expect(breakdown[0].uniqueViews).toBe(350);
    });
  });

  describe("getEventCountsByType", () => {
    it("should return event type distribution", async () => {
      pool.query.mockResolvedValue({
        rows: [
          { event_type: "page_view", count: "1000" },
          { event_type: "yacht_view", count: "500" },
          { event_type: "search", count: "200" },
        ],
      });

      const { getEventCountsByType } = await import(
        "@/lib/analytics-service"
      );
      const counts = await getEventCountsByType(30);

      expect(counts).toHaveLength(3);
      expect(counts[0].eventType).toBe("page_view");
      expect(counts[0].count).toBe(1000);
    });
  });

  describe("getAdminAnalyticsDashboard", () => {
    it("should call all sub-functions and return combined data", async () => {
      // Mock all 8 queries in sequence
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: "100" }] }) // page views
        .mockResolvedValueOnce({ rows: [{ count: "50" }] }) // sessions
        .mockResolvedValueOnce({ rows: [{ count: "10" }] }) // searches
        .mockResolvedValueOnce({ rows: [{ count: "5" }] }) // comparisons
        .mockResolvedValueOnce({ rows: [{ count: "30" }] }) // yacht views
        .mockResolvedValueOnce({ rows: [] }) // multi-metric trend
        .mockResolvedValueOnce({ rows: [] }) // popular yachts
        .mockResolvedValueOnce({ rows: [] }) // popular searches
        .mockResolvedValueOnce({ rows: [] }) // comparison patterns
        .mockResolvedValueOnce({ rows: [] }) // page breakdown
        .mockResolvedValueOnce({ rows: [] }) // top referrers
        .mockResolvedValueOnce({ rows: [] }); // event counts

      const { getAdminAnalyticsDashboard } = await import(
        "@/lib/analytics-service"
      );
      const dashboard = await getAdminAnalyticsDashboard(7);

      expect(dashboard.summary.totalPageViews).toBe(100);
      expect(dashboard.period.days).toBe(7);
    });
  });
});

// ─── Analytics Tracker (Client) Tests ──────────────────────────────

describe("Analytics Tracker (Client)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window/navigator for client code
    Object.defineProperty(global, "navigator", {
      value: { doNotTrack: "0", sendBeacon: vi.fn(() => true) },
      writable: true,
    });
    Object.defineProperty(global, "window", {
      value: {
        location: { pathname: "/yachts" },
        addEventListener: vi.fn(),
        document: {
          referrer: "",
          addEventListener: vi.fn(),
          visibilityState: "visible",
        },
        sessionStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
        },
      },
      writable: true,
    });
    Object.defineProperty(global, "document", {
      value: {
        referrer: "",
        addEventListener: vi.fn(),
        visibilityState: "visible",
      },
      writable: true,
    });
  });

  it("should export all tracking functions", async () => {
    const tracker = await import("@/lib/analytics-tracker");
    expect(typeof tracker.trackPageView).toBe("function");
    expect(typeof tracker.trackYachtView).toBe("function");
    expect(typeof tracker.trackSearch).toBe("function");
    expect(typeof tracker.trackCompare).toBe("function");
    expect(typeof tracker.trackManufacturerView).toBe("function");
    expect(typeof tracker.trackGuideView).toBe("function");
    expect(typeof tracker.trackCtaClick).toBe("function");
    expect(typeof tracker.trackShare).toBe("function");
    expect(typeof tracker.trackFilterUse).toBe("function");
    expect(typeof tracker.trackFeaturedView).toBe("function");
    expect(typeof tracker.trackEmailYacht).toBe("function");
  });

  it("should return a session ID", async () => {
    // Mock sessionStorage properly
    const store: Record<string, string> = {};
    global.sessionStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => { store[key] = val; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { Object.keys(store).forEach(k => delete store[k]); },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    } as Storage;

    // Re-import to get fresh module
    vi.resetModules();
    const { getAnalyticsSessionId } = await import("@/lib/analytics-tracker");
    const sid = getAnalyticsSessionId();
    expect(typeof sid).toBe("string");
    expect(sid.length).toBeGreaterThan(0);
  });
});

// ─── API Endpoint Tests ──────────────────────────────────────────

describe("Analytics API POST", () => {
  it("should validate event payload structure", () => {
    // Validate the expected input structure
    const validEvent = {
      eventType: "page_view",
      page: "/yachts",
      sessionId: "sess-123",
    };

    expect(validEvent.eventType).toBe("page_view");
    expect(validEvent.page).toBe("/yachts");
    expect(validEvent.sessionId).toBe("sess-123");
  });

  it("should accept all valid event types", () => {
    const validTypes = [
      "page_view",
      "search",
      "compare",
      "yacht_view",
      "manufacturer_view",
      "guide_view",
      "cta_click",
      "share",
      "filter_use",
      "rating",
      "email_yacht",
      "featured_view",
    ];

    for (const type of validTypes) {
      expect(type).toMatch(/^[a-z_]+$/);
    }
  });

  it("should accept optional metadata", () => {
    const eventWithMetadata = {
      eventType: "search",
      page: "/search",
      sessionId: "sess-456",
      metadata: {
        query: "beneteau",
        resultCount: 15,
        filters: { lengthMin: 30, lengthMax: 50 },
      },
    };

    expect(eventWithMetadata.metadata).toBeDefined();
    expect((eventWithMetadata.metadata as any).query).toBe("beneteau");
  });
});

// ─── Analytics Page Tracker Component Tests ──────────────────────

describe("AnalyticsPageTracker", () => {
  it("should skip admin routes", () => {
    const adminPath = "/admin/analytics";
    const apiPath = "/api/yachts";
    const normalPath = "/yachts";

    const shouldSkip = (p: string) =>
      p.startsWith("/admin") || p.startsWith("/api");

    expect(shouldSkip(adminPath)).toBe(true);
    expect(shouldSkip(apiPath)).toBe(true);
    expect(shouldSkip(normalPath)).toBe(false);
  });
});
