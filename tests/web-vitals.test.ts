import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/vitals/route";

describe("Web Vitals API", () => {
  describe("POST /api/vitals", () => {
    it("should accept valid metrics", async () => {
      const body = {
        metrics: [
          {
            name: "LCP",
            value: 2500,
            rating: "good",
            delta: 2500,
            navigationType: "navigate",
            url: "/yachts",
            timestamp: Date.now(),
          },
        ],
      };

      const req = new NextRequest("http://localhost/api/vitals", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.stored).toBe(1);
    });

    it("should reject empty metrics array", async () => {
      const req = new NextRequest("http://localhost/api/vitals", {
        method: "POST",
        body: JSON.stringify({ metrics: [] }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should reject invalid request body", async () => {
      const req = new NextRequest("http://localhost/api/vitals", {
        method: "POST",
        body: "invalid json",
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should filter out invalid metrics", async () => {
      const body = {
        metrics: [
          { name: "LCP", value: "not a number", url: "/test", timestamp: Date.now() },
          { name: "INP", value: 100, rating: "good", delta: 50, navigationType: "navigate", url: "/yachts", timestamp: Date.now() },
        ],
      };

      const req = new NextRequest("http://localhost/api/vitals", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.stored).toBe(1);
    });

    it("should count poor metrics in response", async () => {
      const body = {
        metrics: [
          { name: "LCP", value: 5000, rating: "poor", delta: 5000, navigationType: "navigate", url: "/yachts", timestamp: Date.now() },
          { name: "INP", value: 100, rating: "good", delta: 50, navigationType: "navigate", url: "/yachts", timestamp: Date.now() },
        ],
      };

      const req = new NextRequest("http://localhost/api/vitals", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });

      const res = await POST(req);
      const data = await res.json();
      expect(data.poorCount).toBe(1);
    });
  });

  describe("GET /api/vitals", () => {
    it("should return aggregated stats", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1");
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.stats.length).toBeGreaterThan(0);
      expect(data.totalMetrics).toBeGreaterThan(0);
      expect(data.uniquePages).toBeGreaterThan(0);
    });

    it("should return stats with correct structure", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1");
      const res = await GET(req);
      const data = await res.json();

      const lcpStat = data.stats.find((s: { name: string }) => s.name === "LCP");
      expect(lcpStat).toBeDefined();
      expect(lcpStat.count).toBeGreaterThan(0);
      expect(lcpStat.p50).toBeGreaterThan(0);
      expect(lcpStat.p75).toBeGreaterThan(0);
      expect(lcpStat.p95).toBeGreaterThan(0);
      expect(typeof lcpStat.good).toBe("number");
      expect(typeof lcpStat.needsImprovement).toBe("number");
      expect(typeof lcpStat.poor).toBe("number");
    });

    it("should filter by URL", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1&url=/yachts");
      const res = await GET(req);
      const data = await res.json();

      expect(data.totalMetrics).toBeGreaterThan(0);
    });

    it("should return top pages", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1");
      const res = await GET(req);
      const data = await res.json();

      expect(data.topPages.length).toBeGreaterThan(0);
      expect(data.topPages[0].url).toBeDefined();
      expect(data.topPages[0].count).toBeGreaterThan(0);
    });

    it("should return recent poor metrics", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1");
      const res = await GET(req);
      const data = await res.json();

      // We seeded a poor LCP=5000 in earlier tests
      expect(Array.isArray(data.recentPoor)).toBe(true);
      const poorLcp = data.recentPoor.find((m: { name: string }) => m.name === "LCP");
      expect(poorLcp).toBeDefined();
      expect(poorLcp.value).toBe(5000);
    });

    it("should return thresholds", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1");
      const res = await GET(req);
      const data = await res.json();

      expect(data.thresholds.LCP).toEqual({ good: 2500, poor: 4000 });
      expect(data.thresholds.INP).toEqual({ good: 200, poor: 500 });
      expect(data.thresholds.CLS).toEqual({ good: 0.1, poor: 0.25 });
    });

    it("should return empty data when no metrics match", async () => {
      const req = new NextRequest("http://localhost/api/vitals?hours=1&url=/nonexistent-page-xyz");
      const res = await GET(req);
      const data = await res.json();

      expect(data.totalMetrics).toBe(0);
      expect(data.stats).toEqual([]);
      expect(data.topPages).toEqual([]);
      expect(data.recentPoor).toEqual([]);
    });
  });
});

describe("Web Vitals lib", () => {
  it("should export initWebVitals function", async () => {
    const { initWebVitals } = await import("@/lib/web-vitals");
    expect(typeof initWebVitals).toBe("function");
  });
});
