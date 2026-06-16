/**
 * P27.2 — API Security & Validation Tests
 * 
 * Tests for input validation schemas and rate limiting utilities.
 */
import { describe, it, expect } from "vitest";
import {
  abEventSchema,
  searchIntentRecordSchema,
  userFavoriteSchema,
  userSavedSearchSchema,
  userSavedComparisonSchema,
  userAccountUpdateSchema,
  pushSubscriptionSchema,
  alertPreferencesSchema,
  emailYachtSchema,
  compareShareSchema,
  compareReportSchema,
  quizAnswersSchema,
} from "@/lib/validations";
import {
  checkRateLimit,
  checkLoginRateLimit,
  recordFailedLogin,
  recordSuccessfulLogin,
  getLoginBackoffDelay,
  READ_RATE_LIMIT,
  WRITE_RATE_LIMIT,
  STRICT_WRITE_RATE_LIMIT,
} from "@/lib/rate-limit";

// ─── Validation Schema Tests ─────────────────────────────────────────────

describe("abEventSchema", () => {
  it("accepts valid event data", () => {
    const result = abEventSchema.safeParse({
      experimentId: "exp1",
      variantId: "A",
      userId: "user123",
      eventType: "impression",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid eventType", () => {
    const result = abEventSchema.safeParse({
      experimentId: "exp1",
      variantId: "A",
      userId: "user123",
      eventType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = abEventSchema.safeParse({
      eventType: "click",
    });
    expect(result.success).toBe(false);
  });
});

describe("searchIntentRecordSchema", () => {
  it("accepts valid search query", () => {
    const result = searchIntentRecordSchema.safeParse({
      searchQuery: "beneteau oceanis 40",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty search query", () => {
    const result = searchIntentRecordSchema.safeParse({
      searchQuery: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing search query", () => {
    const result = searchIntentRecordSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("userFavoriteSchema", () => {
  it("accepts valid yacht model ID", () => {
    const result = userFavoriteSchema.safeParse({ yachtModelId: 42 });
    expect(result.success).toBe(true);
  });

  it("rejects string ID", () => {
    const result = userFavoriteSchema.safeParse({ yachtModelId: "42" });
    expect(result.success).toBe(false);
  });

  it("rejects negative ID", () => {
    const result = userFavoriteSchema.safeParse({ yachtModelId: -1 });
    expect(result.success).toBe(false);
  });
});

describe("userSavedSearchSchema", () => {
  it("accepts valid search with params", () => {
    const result = userSavedSearchSchema.safeParse({
      searchParams: { manufacturer: "Beneteau", minLength: 30 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing searchParams", () => {
    const result = userSavedSearchSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("userSavedComparisonSchema", () => {
  it("accepts 2-4 yacht IDs", () => {
    expect(userSavedComparisonSchema.safeParse({ yachtIds: [1, 2] }).success).toBe(true);
    expect(userSavedComparisonSchema.safeParse({ yachtIds: [1, 2, 3, 4] }).success).toBe(true);
  });

  it("rejects less than 2 IDs", () => {
    const result = userSavedComparisonSchema.safeParse({ yachtIds: [1] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 4 IDs", () => {
    const result = userSavedComparisonSchema.safeParse({ yachtIds: [1, 2, 3, 4, 5] });
    expect(result.success).toBe(false);
  });
});

describe("userAccountUpdateSchema", () => {
  it("accepts boolean privacy flags", () => {
    const result = userAccountUpdateSchema.safeParse({
      analyticsOptOut: true,
      communicationOptOut: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-boolean values", () => {
    const result = userAccountUpdateSchema.safeParse({
      analyticsOptOut: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty object (no updates)", () => {
    const result = userAccountUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("pushSubscriptionSchema", () => {
  it("accepts valid push subscription", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      keys: { p256dh: "key1", auth: "key2" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing keys", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: "https://example.com/push",
      keys: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid endpoint URL", () => {
    const result = pushSubscriptionSchema.safeParse({
      endpoint: "not-a-url",
      keys: { p256dh: "key1", auth: "key2" },
    });
    expect(result.success).toBe(false);
  });
});

describe("alertPreferencesSchema", () => {
  it("accepts valid alert type", () => {
    const result = alertPreferencesSchema.safeParse({
      alertType: "new_yachts",
      enabled: true,
      frequency: "daily",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid alert type", () => {
    const result = alertPreferencesSchema.safeParse({
      alertType: "invalid_type",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid frequency", () => {
    const result = alertPreferencesSchema.safeParse({
      alertType: "price_changes",
      frequency: "monthly",
    });
    expect(result.success).toBe(false);
  });
});

describe("emailYachtSchema", () => {
  it("accepts valid email share", () => {
    const result = emailYachtSchema.safeParse({
      recipientEmail: "friend@example.com",
      yachtSlug: "beneteau-oceanis-40-1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = emailYachtSchema.safeParse({
      recipientEmail: "not-an-email",
      yachtSlug: "beneteau-oceanis-40-1",
    });
    expect(result.success).toBe(false);
  });
});

describe("compareReportSchema", () => {
  it("accepts valid report request", () => {
    const result = compareReportSchema.safeParse({
      email: "user@example.com",
      yachtIds: [1, 2, 3],
    });
    expect(result.success).toBe(true);
  });

  it("rejects less than 2 yachts", () => {
    const result = compareReportSchema.safeParse({
      email: "user@example.com",
      yachtIds: [1],
    });
    expect(result.success).toBe(false);
  });
});

describe("quizAnswersSchema", () => {
  it("accepts valid quiz answers", () => {
    const result = quizAnswersSchema.safeParse({
      experience: "intermediate",
      sailingType: "cruising",
      crewSize: "2-4",
      budget: "100k-200k",
      preferredLength: "35-45ft",
      keelPreference: "fin",
      priority: "comfort",
    });
    expect(result.success).toBe(true);
  });
});

// ─── Rate Limiting Tests ─────────────────────────────────────────────────

describe("checkRateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = checkRateLimit(key, { limit: 5, windowSeconds: 60 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const key = `test-block-${Date.now()}`;
    const opts = { limit: 3, windowSeconds: 60 };
    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    checkRateLimit(key, opts);
    const result = checkRateLimit(key, opts);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const key = `test-reset-${Date.now()}`;
    const opts = { limit: 1, windowSeconds: 1 };
    const first = checkRateLimit(key, opts);
    expect(first.allowed).toBe(true);
    const blocked = checkRateLimit(key, opts);
    expect(blocked.allowed).toBe(false);
    // Wait for reset
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const afterReset = checkRateLimit(key, opts);
        expect(afterReset.allowed).toBe(true);
        resolve();
      }, 1100);
    });
  });
});

describe("Login brute-force protection", () => {
  it("allows initial attempts", () => {
    const ip = `test-login-${Date.now()}`;
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(10);
  });

  it("records and tracks failed attempts", () => {
    const ip = `test-fail-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(ip);
    }
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(5);
  });

  it("locks out after max attempts", () => {
    const ip = `test-lock-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      recordFailedLogin(ip);
    }
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.remainingAttempts).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("clears attempts on successful login", () => {
    const ip = `test-success-${Date.now()}`;
    recordFailedLogin(ip);
    recordFailedLogin(ip);
    recordSuccessfulLogin(ip);
    const result = checkLoginRateLimit(ip);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(10);
  });

  it("returns exponential backoff after threshold", () => {
    const ip = `test-backoff-${Date.now()}`;
    for (let i = 0; i < 6; i++) {
      recordFailedLogin(ip);
    }
    const delay = getLoginBackoffDelay(ip);
    expect(delay).toBeGreaterThan(0);
  });

  it("returns 0 backoff below threshold", () => {
    const ip = `test-nobackoff-${Date.now()}`;
    recordFailedLogin(ip);
    recordFailedLogin(ip);
    const delay = getLoginBackoffDelay(ip);
    expect(delay).toBe(0);
  });
});

// ─── Rate Limit Presets ──────────────────────────────────────────────────

describe("Rate limit presets", () => {
  it("READ_RATE_LIMIT allows 120 per minute", () => {
    expect(READ_RATE_LIMIT.limit).toBe(120);
    expect(READ_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("WRITE_RATE_LIMIT allows 20 per minute", () => {
    expect(WRITE_RATE_LIMIT.limit).toBe(20);
    expect(WRITE_RATE_LIMIT.windowSeconds).toBe(60);
  });

  it("STRICT_WRITE_RATE_LIMIT allows 5 per hour", () => {
    expect(STRICT_WRITE_RATE_LIMIT.limit).toBe(5);
    expect(STRICT_WRITE_RATE_LIMIT.windowSeconds).toBe(3600);
  });
});
