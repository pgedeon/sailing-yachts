/**
 * Tests for Guides CMS Admin API
 * Verifies API endpoints for article CRUD operations.
 */

import { test, expect } from "@playwright/test";

const BASE_URL = "https://info.sailboats.fr";

test.describe("Admin Guides API", () => {
  const testSlug = `test-guide-${Date.now()}`;

  test("POST /api/admin/guides — should reject unauthenticated requests", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/guides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Guide",
        slug: testSlug,
        content: "Test content",
      }),
    });
    expect(res.status).toBe(401);
  });

  test("GET /api/admin/guides — should reject unauthenticated requests", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/guides`);
    expect(res.status).toBe(401);
  });
});

test.describe("Public Articles API", () => {
  test("GET /api/articles — should return published articles", async () => {
    const res = await fetch(`${BASE_URL}/api/articles`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty("articles");
    expect(Array.isArray(data.articles)).toBe(true);
  });

  test("GET /api/articles?category=... — should filter by category", async () => {
    const res = await fetch(`${BASE_URL}/api/articles`);
    const data = await res.json();

    if (data.articles.length > 0 && data.articles[0].category) {
      const catRes = await fetch(
        `${BASE_URL}/api/articles?category=${encodeURIComponent(data.articles[0].category)}`
      );
      expect(catRes.status).toBe(200);
      const catData = await catRes.json();
      expect(Array.isArray(catData.articles)).toBe(true);
    }
  });
});

test.describe("Guide Form Validation", () => {
  test("should auto-generate slug from title", () => {
    const autoSlug = (title: string) =>
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    expect(autoSlug("How to Choose Your First Sailboat")).toBe(
      "how-to-choose-your-first-sailboat"
    );
    expect(autoSlug("  Sailing in 2024!  ")).toBe("sailing-in-2024");
    expect(autoSlug("Beneteau Oceanis 40.1 Review")).toBe(
      "beneteau-oceanis-40-1-review"
    );
  });

  test("should calculate reading time from word count", () => {
    const calcReadTime = (text: string) =>
      Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200));

    expect(calcReadTime("")).toBe(1);
    expect(calcReadTime("one two three")).toBe(1);
    expect(calcReadTime("word ".repeat(200))).toBe(1);
    expect(calcReadTime("word ".repeat(201))).toBe(2);
    expect(calcReadTime("word ".repeat(600))).toBe(3);
  });
});
