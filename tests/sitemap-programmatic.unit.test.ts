import { describe, it, expect, vi } from "vitest";

describe("Sitemap Programmatic Route", () => {
  it("should export a GET handler", async () => {
    const mod = await import("../app/sitemap-programmatic.xml/route");
    expect(typeof mod.GET).toBe("function");
  });

  it("should return valid XML with programmatic page URLs", async () => {
    const { GET } = await import("../app/sitemap-programmatic.xml/route");
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("xml");

    const xml = await response.text();

    // XML declaration
    expect(xml.startsWith("<?xml")).toBe(true);

    // urlset root element
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });
});
