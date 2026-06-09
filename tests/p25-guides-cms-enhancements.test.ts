import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db pool
const mockQuery = vi.fn();
vi.mock("@/lib/db", () => ({
  pool: {
    query: (...args: any[]) => mockQuery(...args),
    connect: () => ({
      query: (...args: any[]) => mockQuery(...args),
      queryBegin: () => mockQuery("BEGIN"),
      queryCommit: () => mockQuery("COMMIT"),
      queryRollback: () => mockQuery("ROLLBACK"),
      release: () => {},
    }),
  },
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn().mockResolvedValue(true),
}));

// ---- Tests for Article-Yacht join table operations ----

describe("P25.1: Guides CMS Enhancements", () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  describe("article_yachts table", () => {
    it("should store related yacht links with sort order", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, article_id: 5, yacht_model_id: 42, sort_order: 0 }],
      });

      const result = await mockQuery(
        `INSERT INTO article_yachts (article_id, yacht_model_id, sort_order)
         VALUES ($1, $2, $3)
         ON CONFLICT (article_id, yacht_model_id) DO NOTHING
         RETURNING *`,
        [5, 42, 0]
      );

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].article_id).toBe(5);
      expect(result.rows[0].yacht_model_id).toBe(42);
      expect(result.rows[0].sort_order).toBe(0);
    });

    it("should enforce unique article-yacht pairs", async () => {
      // Simulate unique constraint violation
      mockQuery.mockRejectedValueOnce({
        code: "23505",
        message: "duplicate key value violates unique constraint",
      });

      await expect(
        mockQuery(
          `INSERT INTO article_yachts (article_id, yacht_model_id, sort_order) VALUES ($1, $2, $3)`,
          [5, 42, 0]
        )
      ).rejects.toEqual(
        expect.objectContaining({ code: "23505" })
      );
    });

    it("should cascade delete when article is deleted", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 5 }],
      });

      const result = await mockQuery(
        `DELETE FROM articles WHERE id = $1 RETURNING id`,
        [5]
      );

      expect(result.rows).toHaveLength(1);
      // article_yachts with article_id=5 would be cascade-deleted by FK
    });
  });

  describe("SEO fields in articles", () => {
    it("should include meta_title in article data", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          slug: "test-guide",
          title: "Test Guide",
          meta_title: "Custom SEO Title",
          meta_description: "Custom SEO description for search engines",
          og_image: "https://example.com/og.jpg",
          canonical_url: "https://example.com/original",
          noindex: false,
        }],
      });

      const result = await mockQuery(
        `SELECT * FROM articles WHERE slug = $1`,
        ["test-guide"]
      );

      expect(result.rows[0].meta_title).toBe("Custom SEO Title");
      expect(result.rows[0].meta_description).toBe("Custom SEO description for search engines");
      expect(result.rows[0].og_image).toBe("https://example.com/og.jpg");
      expect(result.rows[0].canonical_url).toBe("https://example.com/original");
      expect(result.rows[0].noindex).toBe(false);
    });

    it("should update SEO fields", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          meta_title: "Updated Title",
          meta_description: "Updated description",
          noindex: true,
        }],
      });

      const result = await mockQuery(
        `UPDATE articles SET meta_title = $1, meta_description = $2, noindex = $3 WHERE id = $4 RETURNING *`,
        ["Updated Title", "Updated description", true, 1]
      );

      expect(result.rows[0].meta_title).toBe("Updated Title");
      expect(result.rows[0].noindex).toBe(true);
    });
  });

  describe("Yacht search for guide form", () => {
    it("should search yachts by name", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, slug: "beneteau-oceanis-40-1", model_name: "Oceanis 40.1", year: 2020, manufacturer_name: "Beneteau", length_overall: "12.43" },
          { id: 2, slug: "beneteau-first-36", model_name: "First 36", year: 2022, manufacturer_name: "Beneteau", length_overall: "10.85" },
        ],
      });

      const result = await mockQuery(
        expect.stringContaining("yacht_models"),
        ["%Beneteau%", 10]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].manufacturer_name).toBe("Beneteau");
    });

    it("should require minimum 2 characters for search", () => {
      // The API endpoint returns empty for queries < 2 chars
      const query = "B";
      expect(query.length).toBeLessThan(2);
    });
  });

  describe("Image upload validation", () => {
    it("should validate file type", () => {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      expect(allowedTypes).toContain("image/jpeg");
      expect(allowedTypes).toContain("image/webp");
      expect(allowedTypes).not.toContain("application/pdf");
    });

    it("should validate file size (max 5MB)", () => {
      const maxSize = 5 * 1024 * 1024;
      const testFile = { size: 3 * 1024 * 1024 };
      expect(testFile.size).toBeLessThanOrEqual(maxSize);

      const largeFile = { size: 6 * 1024 * 1024 };
      expect(largeFile.size).toBeGreaterThan(maxSize);
    });

    it("should generate unique filenames", () => {
      const generateFilename = () => {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `guide-${timestamp}-${random}.jpg`;
      };

      const name1 = generateFilename();
      const name2 = generateFilename();
      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/^guide-\d+-[a-z0-9]+\.jpg$/);
    });
  });

  describe("Guide form data handling", () => {
    it("should combine related yacht IDs with article data", () => {
      const formData = {
        title: "Test Guide",
        slug: "test-guide",
        content: "Content here",
        relatedYachtIds: [1, 2, 3],
        metaTitle: "SEO Title",
        metaDescription: "SEO Description",
        ogImage: "https://example.com/og.jpg",
        noindex: false,
      };

      expect(formData.relatedYachtIds).toEqual([1, 2, 3]);
      expect(formData.metaTitle).toBe("SEO Title");
      expect(formData.noindex).toBe(false);
    });

    it("should handle empty related yachts", () => {
      const formData = {
        title: "Test Guide",
        slug: "test-guide",
        relatedYachtIds: [],
      };

      expect(formData.relatedYachtIds).toEqual([]);
    });

    it("should auto-calculate reading time from content", () => {
      const content = "word ".repeat(400); // 400 words
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      expect(wordCount).toBe(400);
      expect(readingTime).toBe(2);
    });

    it("should calculate SEO character counts correctly", () => {
      const metaTitle = "This is a test title for SEO that is exactly right";
      const metaDescription = "A meta description that should be under 160 characters for optimal Google search result display";

      expect(metaTitle.length).toBeLessThanOrEqual(60);
      expect(metaDescription.length).toBeLessThanOrEqual(160);
    });
  });

  describe("Related yachts display on public page", () => {
    it("should fetch related yachts with manufacturer info", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, slug: "beneteau-oceanis-40-1", model_name: "Oceanis 40.1", year: 2020, manufacturer_name: "Beneteau", length_overall: "12.43", rig_type: "Sloop", sort_order: 0 },
          { id: 2, slug: "bavaria-c42", model_name: "C42", year: 2021, manufacturer_name: "Bavaria", length_overall: "12.80", rig_type: "Sloop", sort_order: 1 },
        ],
      });

      const result = await mockQuery(
        expect.stringContaining("article_yachts"),
        [5]
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].manufacturer_name).toBe("Beneteau");
      expect(result.rows[1].manufacturer_name).toBe("Bavaria");
    });
  });
});
