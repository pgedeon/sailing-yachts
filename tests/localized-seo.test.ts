import { describe, it, expect } from "vitest";
import {
  buildLocaleAlternates,
  generateWebsiteJsonLd,
  generateYachtJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
  getSiteUrl,
} from "../lib/seo";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

describe("buildLocaleAlternates", () => {
  it("generates en + fr alternates for a simple path", () => {
    const result = buildLocaleAlternates("/yachts");
    expect(result.canonical).toBe(`${SITE_URL}/en/yachts`);
    expect(result.languages.en).toBe(`${SITE_URL}/en/yachts`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr/yachts`);
  });

  it("handles root path without trailing slash", () => {
    const result = buildLocaleAlternates("/");
    expect(result.canonical).toBe(`${SITE_URL}/en`);
    expect(result.languages.en).toBe(`${SITE_URL}/en`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr`);
  });

  it("handles empty string as root path", () => {
    const result = buildLocaleAlternates("");
    expect(result.canonical).toBe(`${SITE_URL}/en`);
    expect(result.languages.en).toBe(`${SITE_URL}/en`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr`);
  });

  it("strips existing /en or /fr prefix from path", () => {
    const result = buildLocaleAlternates("/en/yachts/beneteau-first-27");
    expect(result.canonical).toBe(`${SITE_URL}/en/yachts/beneteau-first-27`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr/yachts/beneteau-first-27`);
  });

  it("strips /fr prefix too", () => {
    const result = buildLocaleAlternates("/fr/yachts");
    expect(result.canonical).toBe(`${SITE_URL}/en/yachts`);
    expect(result.languages.en).toBe(`${SITE_URL}/en/yachts`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr/yachts`);
  });

  it("handles deep paths", () => {
    const result = buildLocaleAlternates("/compare/beneteau-first-27-vs-jeanneau-sun-odyssey-349");
    expect(result.canonical).toBe(`${SITE_URL}/en/compare/beneteau-first-27-vs-jeanneau-sun-odyssey-349`);
    expect(result.languages.en).toBe(`${SITE_URL}/en/compare/beneteau-first-27-vs-jeanneau-sun-odyssey-349`);
    expect(result.languages.fr).toBe(`${SITE_URL}/fr/compare/beneteau-first-27-vs-jeanneau-sun-odyssey-349`);
  });
});

describe("generateWebsiteJsonLd — locale aware", () => {
  it("returns English defaults", () => {
    const jsonLd = generateWebsiteJsonLd("en");
    expect(jsonLd["@type"]).toBe("WebSite");
    expect(jsonLd.url).toBe(`${SITE_URL}/en`);
    expect(jsonLd.description).toBe(
      "Comprehensive database of sailing yacht specifications with advanced search and comparison tools."
    );
    expect(jsonLd.potentialAction.target).toContain("/en/yachts");
  });

  it("returns French content", () => {
    const jsonLd = generateWebsiteJsonLd("fr");
    expect(jsonLd["@type"]).toBe("WebSite");
    expect(jsonLd.url).toBe(`${SITE_URL}/fr`);
    expect(jsonLd.description).toBe(
      "Base de données complète de spécifications de voiliers avec recherche avancée et outils de comparaison."
    );
    expect(jsonLd.potentialAction.target).toContain("/fr/yachts");
  });

  it("defaults to en when no locale provided", () => {
    const jsonLd = generateWebsiteJsonLd();
    expect(jsonLd.url).toBe(`${SITE_URL}/en`);
  });
});

describe("generateYachtJsonLd — locale aware", () => {
  const sampleYacht = {
    manufacturer: "Beneteau",
    modelName: "First 27",
    year: 2020,
    slug: "beneteau-first-27",
    lengthOverall: 8.2,
    beam: 2.99,
    draft: 1.6,
    displacement: 1800,
    hullMaterial: "GRP",
    rigType: "Fractional Sloop",
    cabins: 2,
    description: null,
    reviews: null,
  };

  it("generates English property names", () => {
    const jsonLd = generateYachtJsonLd(sampleYacht, "en");
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.url).toBe(`${SITE_URL}/en/yachts/beneteau-first-27`);

    const propNames = jsonLd.additionalProperty!.map((p) => p.name);
    expect(propNames).toContain("Length Overall");
    expect(propNames).toContain("Beam");
    expect(propNames).toContain("Draft");
    expect(propNames).toContain("Displacement");
    expect(propNames).toContain("Hull Material");
    expect(propNames).toContain("Rig Type");
    expect(propNames).toContain("Cabins");
  });

  it("generates French property names", () => {
    const jsonLd = generateYachtJsonLd(sampleYacht, "fr");
    expect(jsonLd.url).toBe(`${SITE_URL}/fr/yachts/beneteau-first-27`);

    const propNames = jsonLd.additionalProperty!.map((p) => p.name);
    expect(propNames).toContain("Longueur hors tout");
    expect(propNames).toContain("Bau");
    expect(propNames).toContain("Tirant d'eau");
    expect(propNames).toContain("Déplacement");
    expect(propNames).toContain("Matériau de coque");
    expect(propNames).toContain("Type de gréement");
    expect(propNames).toContain("Cabines");
  });

  it("uses French fallback description when yacht has no description", () => {
    const jsonLd = generateYachtJsonLd(sampleYacht, "fr");
    expect(jsonLd.description).toContain("spécifications et détails du voilier");
  });

  it("uses English fallback description when yacht has no description", () => {
    const jsonLd = generateYachtJsonLd(sampleYacht, "en");
    expect(jsonLd.description).toContain("sailing yacht specifications and details");
  });

  it("preserves actual description when provided", () => {
    const yachtWithDesc = { ...sampleYacht, description: "A great racer-cruiser" };
    const jsonLd = generateYachtJsonLd(yachtWithDesc, "en");
    expect(jsonLd.description).toBe("A great racer-cruiser");
  });
});

describe("generateBreadcrumbJsonLd — locale aware", () => {
  it("generates locale-prefixed URLs", () => {
    const jsonLd = generateBreadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Yachts", path: "/yachts" },
        { name: "Beneteau First 27", path: "/yachts/beneteau-first-27" },
      ],
      "fr"
    );

    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toHaveLength(3);
    expect(jsonLd.itemListElement[0].item).toBe(`${SITE_URL}/fr/`);
    expect(jsonLd.itemListElement[1].item).toBe(`${SITE_URL}/fr/yachts`);
    expect(jsonLd.itemListElement[2].item).toBe(
      `${SITE_URL}/fr/yachts/beneteau-first-27`
    );
  });

  it("uses English prefix when locale is en", () => {
    const jsonLd = generateBreadcrumbJsonLd(
      [{ name: "Home", path: "/" }],
      "en"
    );
    expect(jsonLd.itemListElement[0].item).toBe(`${SITE_URL}/en/`);
  });

  it("omits locale prefix when no locale provided (backward compat)", () => {
    const jsonLd = generateBreadcrumbJsonLd([{ name: "Home", path: "/" }]);
    expect(jsonLd.itemListElement[0].item).toBe(`${SITE_URL}/`);
  });
});

describe("generateFaqJsonLd — locale aware", () => {
  const sampleYacht = {
    manufacturer: "Beneteau",
    modelName: "First 27",
    displacement: 1800,
    lengthOverall: 8.2,
    draft: 1.6,
    cabins: 2,
    beam: 2.99,
  };

  it("generates English FAQ questions", () => {
    const faq = generateFaqJsonLd(sampleYacht, "en");
    expect(faq).not.toBeNull();
    expect(faq!["@type"]).toBe("FAQPage");
    const questions = faq!.mainEntity.map((q) => q.name);
    expect(questions.some((q) => q.includes("How much does"))).toBe(true);
    expect(questions.some((q) => q.includes("How long is"))).toBe(true);
    expect(questions.some((q) => q.includes("draft of"))).toBe(true);
    expect(questions.some((q) => q.includes("How many cabins"))).toBe(true);
  });

  it("generates French FAQ questions", () => {
    const faq = generateFaqJsonLd(sampleYacht, "fr");
    expect(faq).not.toBeNull();
    expect(faq!["@type"]).toBe("FAQPage");
    const questions = faq!.mainEntity.map((q) => q.name);
    expect(questions.some((q) => q.includes("Combien pèse"))).toBe(true);
    expect(questions.some((q) => q.includes("Quelle est la longueur"))).toBe(true);
    expect(questions.some((q) => q.includes("tirant d'eau"))).toBe(true);
    expect(questions.some((q) => q.includes("Combien de cabines"))).toBe(true);
  });

  it("generates French FAQ answers", () => {
    const faq = generateFaqJsonLd(sampleYacht, "fr");
    const answers = faq!.mainEntity.map((q) => q.acceptedAnswer.text);
    expect(answers.some((a) => a.includes("déplacement"))).toBe(true);
    expect(answers.some((a) => a.includes("longueur hors tout"))).toBe(true);
    expect(answers.some((a) => a.includes("tirant d'eau"))).toBe(true);
    expect(answers.some((a) => a.includes("cabine"))).toBe(true);
  });

  it("returns null when yacht has no relevant specs", () => {
    const minimalYacht = {
      manufacturer: "Unknown",
      modelName: "Mystery",
    };
    const faq = generateFaqJsonLd(minimalYacht, "en");
    expect(faq).toBeNull();
  });
});
