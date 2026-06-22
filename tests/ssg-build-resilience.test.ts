/**
 * Tests for SSG build resilience — DB connection failures should not crash the build.
 * Issue #456: SSG build resilience: handle DB connection failures in generateStaticParams
 */

import { describe, it, expect } from "vitest";
import { buildSafeQuery, safeDataFetch } from "@/lib/build-safe";

// ─── build-safe tests ───────────────────────────────────────────────

describe("build-safe utilities", () => {
  describe("buildSafeQuery", () => {
    it("should return fallback when DB query fails with password auth error", async () => {
      const fallback = { rows: [] as any[] } as any;

      const result = await buildSafeQuery(
        () => Promise.reject(new Error("password authentication failed for user neondb_owner")),
        fallback
      );

      expect(result).toBe(fallback);
    });

    it("should return fallback on ECONNREFUSED", async () => {
      const fallback = { rows: [] as any[] } as any;

      const result = await buildSafeQuery(
        () => Promise.reject(new Error("connect ECONNREFUSED 127.0.0.1:5432")),
        fallback
      );

      expect(result).toBe(fallback);
    });

    it("should return fallback on ENOTFOUND", async () => {
      const result = await buildSafeQuery(
        () => Promise.reject(new Error("getaddrinfo ENOTFOUND db.example.com")),
        []
      );

      expect(result).toEqual([]);
    });

    it("should return fallback on ETIMEDOUT", async () => {
      const result = await buildSafeQuery(
        () => Promise.reject(new Error("connect ETIMEDOUT")),
        "fallback"
      );

      expect(result).toBe("fallback");
    });

    it("should return fallback on 'too many clients already'", async () => {
      const result = await buildSafeQuery(
        () => Promise.reject(new Error("too many clients already")),
        "fallback"
      );

      expect(result).toBe("fallback");
    });

    it("should throw on non-connection errors (e.g. SQL bugs)", async () => {
      await expect(
        buildSafeQuery(
          () => Promise.reject(new Error('column "nonexistent" does not exist')),
          []
        )
      ).rejects.toThrow("column");
    });

    it("should throw on syntax errors", async () => {
      await expect(
        buildSafeQuery(
          () => Promise.reject(new Error('syntax error at or near "FROM"')),
          []
        )
      ).rejects.toThrow("syntax error");
    });

    it("should return actual data when query succeeds", async () => {
      const data = [{ id: 1, name: "Test" }];

      const result = await buildSafeQuery(async () => data, []);

      expect(result).toBe(data);
    });

    it("should detect DB errors in err.cause", async () => {
      const error = new Error("query failed");
      (error as any).cause = new Error("password authentication failed");

      const result = await buildSafeQuery(() => Promise.reject(error), "fallback");

      expect(result).toBe("fallback");
    });
  });

  describe("safeDataFetch", () => {
    it("should return null when DB connection fails (password auth)", async () => {
      const result = await safeDataFetch(() =>
        Promise.reject(new Error("password authentication failed for user neondb_owner"))
      );
      expect(result).toBeNull();
    });

    it("should return null on connection terminated", async () => {
      const result = await safeDataFetch(() =>
        Promise.reject(new Error("connection terminated unexpectedly"))
      );
      expect(result).toBeNull();
    });

    it("should return null on ECONNREFUSED", async () => {
      const result = await safeDataFetch(() =>
        Promise.reject(new Error("connect ECONNREFUSED"))
      );
      expect(result).toBeNull();
    });

    it("should return null on 'terminating connection due to administrator command'", async () => {
      const result = await safeDataFetch(() =>
        Promise.reject(new Error("terminating connection due to administrator command"))
      );
      expect(result).toBeNull();
    });

    it("should throw on non-connection errors", async () => {
      await expect(
        safeDataFetch(() => Promise.reject(new Error("syntax error at or near SELECT")))
      ).rejects.toThrow("syntax error");
    });

    it("should return data when fetch succeeds", async () => {
      const data = { yachts: [{ id: 1 }], total: 1 };
      const result = await safeDataFetch(async () => data);
      expect(result).toEqual(data);
    });

    it("should detect DB errors in err.cause", async () => {
      const error = new Error("query failed");
      (error as any).cause = new Error("ECONNREFUSED 10.0.0.1:5432");

      const result = await safeDataFetch(() => Promise.reject(error));
      expect(result).toBeNull();
    });

    it("should not catch generic TypeError", async () => {
      await expect(
        safeDataFetch(() => Promise.reject(new TypeError("Cannot read properties of undefined")))
      ).rejects.toThrow("Cannot read");
    });
  });
});

// ─── Integration: verify error detection patterns ───────────────────

describe("DB connection error patterns", () => {
  const connectionErrorMessages = [
    "password authentication failed for user neondb_owner",
    "connect ECONNREFUSED 127.0.0.1:5432",
    "getaddrinfo ENOTFOUND db.example.com",
    "connect ETIMEDOUT",
    "Failed to parse URL: invalid connection string",
    "terminating connection due to administrator command",
    "connection terminated unexpectedly",
    "too many clients already",
  ];

  for (const msg of connectionErrorMessages) {
    it(`buildSafeQuery should catch: "${msg.slice(0, 40)}..."`, async () => {
      const result = await buildSafeQuery(
        () => Promise.reject(new Error(msg)),
        "fallback"
      );
      expect(result).toBe("fallback");
    });
  }

  const nonConnectionErrorMessages = [
    'column "nonexistent" does not exist',
    'syntax error at or near "SELECT"',
    "relation \"yacht_models\" does not exist",
    "duplicate key value violates unique constraint",
    "value too long for type character varying(255)",
  ];

  for (const msg of nonConnectionErrorMessages) {
    it(`buildSafeQuery should NOT catch: "${msg.slice(0, 40)}..."`, async () => {
      await expect(
        buildSafeQuery(() => Promise.reject(new Error(msg)), "fallback")
      ).rejects.toThrow();
    });
  }
});
