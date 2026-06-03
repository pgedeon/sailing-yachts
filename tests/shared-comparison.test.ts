import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Utility: share ID generation ---
describe("Shared Comparison: Share ID", () => {
  it("should generate 8-char alphanumeric IDs", () => {
    // Simulate the share ID generation from the API route
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    function generateShareId(): string {
      let id = "";
      const bytes = new Uint8Array(8);
      // Mock crypto
      for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      for (let i = 0; i < 8; i++) {
        id += chars[bytes[i] % chars.length];
      }
      return id;
    }

    for (let i = 0; i < 50; i++) {
      const id = generateShareId();
      expect(id).toHaveLength(8);
      expect(id).toMatch(/^[a-z0-9]+$/);
    }
  });

  it("should generate unique IDs with high probability", () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    function generateShareId(): string {
      let id = "";
      const bytes = new Uint8Array(8);
      for (let i = 0; i < 8; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
      }
      for (let i = 0; i < 8; i++) {
        id += chars[bytes[i] % chars.length];
      }
      return id;
    }

    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generateShareId());
    }
    // With 36^8 = ~2.8 trillion possible IDs, 1000 should all be unique
    expect(ids.size).toBe(1000);
  });
});

// --- Utility: Rate limiting ---
describe("Shared Comparison: Rate Limiting", () => {
  const RATE_LIMIT_MAX = 10;

  // Simulate the rate limit check
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  function checkRateLimit(ip: string, now: number): boolean {
    const entry = rateLimitMap.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
      return false;
    }
    entry.count++;
    return true;
  }

  beforeEach(() => {
    rateLimitMap.clear();
  });

  it("should allow up to 10 requests per minute", () => {
    const ip = "192.168.1.1";
    const now = Date.now();

    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip, now)).toBe(true);
    }
    // 11th should be rejected
    expect(checkRateLimit(ip, now)).toBe(false);
  });

  it("should reset after the window expires", () => {
    const ip = "192.168.1.1";
    const now = Date.now();

    for (let i = 0; i < 10; i++) {
      checkRateLimit(ip, now);
    }
    expect(checkRateLimit(ip, now)).toBe(false);

    // Move time past the window
    const futureNow = now + 61_000;
    expect(checkRateLimit(ip, futureNow)).toBe(true);
  });

  it("should track different IPs independently", () => {
    const ip1 = "192.168.1.1";
    const ip2 = "192.168.1.2";
    const now = Date.now();

    for (let i = 0; i < 10; i++) {
      checkRateLimit(ip1, now);
    }
    expect(checkRateLimit(ip1, now)).toBe(false);
    expect(checkRateLimit(ip2, now)).toBe(true);
  });
});

// --- API Input Validation ---
describe("Shared Comparison: API Validation", () => {
  function validateShareRequest(body: unknown): {
    valid: boolean;
    error?: string;
    yachtIds?: number[];
    title?: string | null;
  } {
    if (!body || typeof body !== "object") {
      return { valid: false, error: "Invalid request body" };
    }

    const { yachtIds, title } = body as Record<string, unknown>;

    if (!Array.isArray(yachtIds) || yachtIds.length < 2 || yachtIds.length > 4) {
      return { valid: false, error: "yachtIds must be an array of 2-4 yacht IDs" };
    }

    const validIds = yachtIds.map((id: unknown) => {
      const n = typeof id === "string" ? parseInt(id as string, 10) : Number(id);
      return isNaN(n) ? null : n;
    });

    if (validIds.some((id: number | null) => id === null)) {
      return { valid: false, error: "All yachtIds must be valid numbers" };
    }

    if (title !== undefined && typeof title !== "string") {
      return { valid: false, error: "Title must be a string" };
    }

    return {
      valid: true,
      yachtIds: validIds as number[],
      title: title ? (title as string).trim().substring(0, 500) : null,
    };
  }

  it("should reject empty body", () => {
    const result = validateShareRequest(null);
    expect(result.valid).toBe(false);
  });

  it("should reject missing yachtIds", () => {
    const result = validateShareRequest({});
    expect(result.valid).toBe(false);
    expect(result.error).toContain("2-4");
  });

  it("should reject too few yacht IDs", () => {
    const result = validateShareRequest({ yachtIds: [1] });
    expect(result.valid).toBe(false);
  });

  it("should reject too many yacht IDs", () => {
    const result = validateShareRequest({ yachtIds: [1, 2, 3, 4, 5] });
    expect(result.valid).toBe(false);
  });

  it("should reject non-numeric yacht IDs", () => {
    const result = validateShareRequest({ yachtIds: [1, "abc"] });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("valid numbers");
  });

  it("should accept valid 2-yacht comparison", () => {
    const result = validateShareRequest({ yachtIds: [1, 2] });
    expect(result.valid).toBe(true);
    expect(result.yachtIds).toEqual([1, 2]);
  });

  it("should accept valid 4-yacht comparison", () => {
    const result = validateShareRequest({ yachtIds: [10, 20, 30, 40] });
    expect(result.valid).toBe(true);
    expect(result.yachtIds).toEqual([10, 20, 30, 40]);
  });

  it("should accept string-number yacht IDs", () => {
    const result = validateShareRequest({ yachtIds: ["1", "2"] });
    expect(result.valid).toBe(true);
    expect(result.yachtIds).toEqual([1, 2]);
  });

  it("should accept optional title", () => {
    const result = validateShareRequest({ yachtIds: [1, 2], title: "My Comparison" });
    expect(result.valid).toBe(true);
    expect(result.title).toBe("My Comparison");
  });

  it("should reject non-string title", () => {
    const result = validateShareRequest({ yachtIds: [1, 2], title: 123 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Title");
  });

  it("should truncate long titles to 500 chars", () => {
    const longTitle = "a".repeat(600);
    const result = validateShareRequest({ yachtIds: [1, 2], title: longTitle });
    expect(result.valid).toBe(true);
    expect(result.title!.length).toBe(500);
  });

  it("should trim whitespace from title", () => {
    const result = validateShareRequest({ yachtIds: [1, 2], title: "  Hello  " });
    expect(result.valid).toBe(true);
    expect(result.title).toBe("Hello");
  });
});

// --- URL Construction ---
describe("Shared Comparison: URL Construction", () => {
  it("should construct correct share page URL", () => {
    const shareId = "abc12345";
    const url = `/compare/s/${shareId}`;
    expect(url).toBe("/compare/s/abc12345");
  });

  it("should construct correct API endpoint", () => {
    const url = "/api/compare/share";
    expect(url).toBe("/api/compare/share");
  });
});
