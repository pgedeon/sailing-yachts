import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  getClientIp,
  rateLimitHeaders,
  DEFAULT_RATE_LIMIT,
  READ_RATE_LIMIT,
  WRITE_RATE_LIMIT,
  STRICT_WRITE_RATE_LIMIT,
} from "@/lib/rate-limit";

describe("Rate Limiting (lib/rate-limit.ts)", () => {
  describe("checkRateLimit", () => {
    it("allows first request and tracks count", () => {
      const result = checkRateLimit("test-key-1", { limit: 5, windowSeconds: 60 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it("blocks after exceeding limit", () => {
      const opts = { limit: 3, windowSeconds: 60 };
      checkRateLimit("test-key-2", opts); // 1
      checkRateLimit("test-key-2", opts); // 2
      const third = checkRateLimit("test-key-2", opts); // 3
      expect(third.allowed).toBe(true);
      expect(third.remaining).toBe(0);

      const fourth = checkRateLimit("test-key-2", opts);
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
    });

    it("uses independent keys per route+IP", () => {
      const opts = { limit: 2, windowSeconds: 60 };
      const r1 = checkRateLimit("route-a:ip1", opts);
      const r2 = checkRateLimit("route-b:ip1", opts);
      expect(r1.allowed).toBe(true);
      expect(r2.allowed).toBe(true);
    });

    it("resets after window expires", () => {
      const opts = { limit: 1, windowSeconds: 1 };
      const first = checkRateLimit("test-reset", opts);
      expect(first.allowed).toBe(true);

      const blocked = checkRateLimit("test-reset", opts);
      expect(blocked.allowed).toBe(false);

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const afterReset = checkRateLimit("test-reset", opts);
          expect(afterReset.allowed).toBe(true);
          resolve();
        }, 1100);
      });
    });
  });

  describe("Rate limit presets", () => {
    it("READ_RATE_LIMIT has higher limit than WRITE_RATE_LIMIT", () => {
      expect(READ_RATE_LIMIT.limit).toBeGreaterThan(WRITE_RATE_LIMIT.limit);
    });

    it("STRICT_WRITE_RATE_LIMIT has long window", () => {
      expect(STRICT_WRITE_RATE_LIMIT.windowSeconds).toBeGreaterThanOrEqual(3600);
    });

    it("DEFAULT_RATE_LIMIT is backward compatible", () => {
      expect(DEFAULT_RATE_LIMIT.limit).toBe(100);
      expect(DEFAULT_RATE_LIMIT.windowSeconds).toBe(60);
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
      });
      expect(getClientIp(request)).toBe("1.2.3.4");
    });

    it("extracts IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: { "x-real-ip": "9.8.7.6" },
      });
      expect(getClientIp(request)).toBe("9.8.7.6");
    });

    it("returns unknown when no headers present", () => {
      const request = new Request("https://example.com");
      expect(getClientIp(request)).toBe("unknown");
    });
  });

  describe("rateLimitHeaders", () => {
    it("generates standard rate limit headers", () => {
      const headers = rateLimitHeaders({
        remaining: 5,
        resetAt: 1700000000000,
        limit: 10,
      });
      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("5");
      expect(headers["X-RateLimit-Reset"]).toBe("1700000000");
      expect(headers["Cache-Control"]).toBe("no-cache");
    });
  });
});
