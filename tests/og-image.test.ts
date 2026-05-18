/**
 * OG Image Route Tests
 * Verifies the dynamic OG image generation API and buildOgImageUrl utility
 */

import { describe, test, expect } from "vitest";
import { buildOgImageUrl } from "@/lib/seo";

describe("buildOgImageUrl", () => {
  test("generates URL with title param", () => {
    const url = buildOgImageUrl({ title: "Oceanis 40.1" });
    expect(url).toContain("/api/og?");
    expect(url).toContain("title=Oceanis+40.1");
  });

  test("includes description when provided", () => {
    const url = buildOgImageUrl({ title: "Test", description: "Beneteau" });
    expect(url).toContain("description=Beneteau");
  });

  test("includes length when number provided", () => {
    const url = buildOgImageUrl({ title: "Test", length: 12.4 });
    expect(url).toContain("length=12.4m+LOA");
  });

  test("includes length as string when provided", () => {
    const url = buildOgImageUrl({ title: "Test", length: "Est. 1884" });
    expect(url).toContain("length=Est.+1884");
  });

  test("omits description when null", () => {
    const url = buildOgImageUrl({ title: "Test", description: null });
    expect(url).not.toContain("description=");
  });

  test("omits length when undefined", () => {
    const url = buildOgImageUrl({ title: "Test" });
    expect(url).not.toContain("length=");
  });

  test("includes type when provided and not default", () => {
    const url = buildOgImageUrl({ type: "manufacturer", title: "Beneteau" });
    expect(url).toContain("type=manufacturer");
  });

  test("omits type when default", () => {
    const url = buildOgImageUrl({ type: "default", title: "Test" });
    expect(url).not.toContain("type=");
  });

  test("omits type when not provided", () => {
    const url = buildOgImageUrl({ title: "Test" });
    expect(url).not.toContain("type=");
  });

  test("generates manufacturer OG URL with all params", () => {
    const url = buildOgImageUrl({
      type: "manufacturer",
      title: "Beneteau",
      description: "France",
      length: "Est. 1884",
    });
    expect(url).toContain("type=manufacturer");
    expect(url).toContain("title=Beneteau");
    expect(url).toContain("description=France");
    expect(url).toContain("length=Est.+1884");
  });

  test("generates compare OG URL", () => {
    const url = buildOgImageUrl({
      type: "compare",
      title: "Oceanis 40.1 vs Sun Odyssey 440",
      description: "Side-by-side comparison",
      length: "12.4m vs 13.2m",
    });
    expect(url).toContain("type=compare");
    expect(url).toContain("title=Oceanis+40.1+vs+Sun+Odyssey+440");
  });

  test("generates glossary OG URL", () => {
    const url = buildOgImageUrl({
      type: "glossary",
      title: "LOA",
      description: "Hull & Forms",
    });
    expect(url).toContain("type=glossary");
    expect(url).toContain("title=LOA");
    expect(url).toContain("description=Hull+%26+Forms");
  });
});

describe("OG image route (production)", () => {
  const BASE = "https://info.sailboats.fr";

  test("default OG image returns PNG", async () => {
    const res = await fetch(`${BASE}/api/og?title=Test`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
    const buf = Buffer.from(await res.arrayBuffer());
    // PNG magic bytes
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50); // P
    expect(buf[2]).toBe(0x4e); // N
    expect(buf[3]).toBe(0x47); // G
  });

  test("OG image with type param returns PNG", async () => {
    const res = await fetch(`${BASE}/api/og?title=Beneteau&type=manufacturer&description=France`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
  });

  test("OG image with compare type returns PNG", async () => {
    const res = await fetch(
      `${BASE}/api/og?title=Oceanis+40.1+vs+Sun+Odyssey+440&type=compare&description=Side-by-side&length=12.4m+vs+13.2m`
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("image/png");
  });
});
