import { describe, it, expect } from "vitest";
import { scoreLead, explainScore, type ScoringInput } from "@/lib/lead-scoring";

describe("Lead Scoring Engine", () => {
  const baseInput: ScoringInput = {
    leadType: "general",
    yachtIds: "1",
    utmSource: null,
    utmMedium: null,
    phone: null,
    message: null,
    email: "test@example.com",
    createdAt: new Date(),
    existingLeadCount: 0,
  };

  it("should score a basic lead", () => {
    const result = scoreLead(baseInput);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(result.tier).toBeDefined();
    expect(result.signals).toBeDefined();
  });

  it("should classify dealer inquiry as hot", () => {
    const result = scoreLead({
      ...baseInput,
      leadType: "dealer_inquiry",
      yachtIds: "1,2,3,4,5",
      phone: "+1234567890",
      message: "I'm interested in purchasing a fleet of sailing yachts for our charter company",
      utmSource: "linkedin",
      utmMedium: "cpc",
    });
    expect(result.total).toBeGreaterThanOrEqual(60);
    expect(result.tier).toBe("hot");
  });

  it("should classify minimal lead as cold", () => {
    const result = scoreLead({
      ...baseInput,
      leadType: "general",
      yachtIds: "",
      createdAt: new Date("2025-01-01"),
    });
    expect(result.total).toBeLessThan(35);
    expect(result.tier).toBe("cold");
  });

  it("should score lead types correctly", () => {
    const types = [
      { type: "dealer_inquiry", minScore: 20 },
      { type: "price_request", minScore: 18 },
      { type: "find_similar", minScore: 12 },
      { type: "general", maxScore: 15 },
    ];

    for (const { type, minScore, maxScore } of types) {
      const result = scoreLead({ ...baseInput, leadType: type });
      if (minScore) expect(result.signals.leadType).toBeGreaterThanOrEqual(minScore);
      if (maxScore) expect(result.signals.leadType).toBeLessThanOrEqual(maxScore);
    }
  });

  it("should score yacht count correctly", () => {
    const counts = [
      { ids: "", expected: 0 },
      { ids: "1", expected: 8 },
      { ids: "1,2", expected: 12 },
      { ids: "1,2,3", expected: 16 },
      { ids: "1,2,3,4,5", expected: 20 },
    ];

    for (const { ids, expected } of counts) {
      const result = scoreLead({ ...baseInput, yachtIds: ids });
      expect(result.signals.yachtCount).toBe(expected);
    }
  });

  it("should score UTM quality", () => {
    const result = scoreLead({ ...baseInput, utmSource: "google", utmMedium: "cpc" });
    expect(result.signals.utmQuality).toBeGreaterThanOrEqual(10);

    const noUtm = scoreLead(baseInput);
    expect(noUtm.signals.utmQuality).toBe(0);
  });

  it("should give phone bonus", () => {
    const withPhone = scoreLead({ ...baseInput, phone: "+1234567890" });
    const withoutPhone = scoreLead(baseInput);
    expect(withPhone.signals.hasPhone).toBe(10);
    expect(withoutPhone.signals.hasPhone).toBe(0);
    expect(withPhone.total).toBeGreaterThan(withoutPhone.total);
  });

  it("should score message quality", () => {
    const longMsg = scoreLead({ ...baseInput, message: "This is a detailed message about buying a yacht" });
    const shortMsg = scoreLead({ ...baseInput, message: "Hi" });
    const noMsg = scoreLead(baseInput);

    expect(longMsg.signals.hasMessage).toBe(10);
    expect(shortMsg.signals.hasMessage).toBe(5);
    expect(noMsg.signals.hasMessage).toBe(0);
  });

  it("should give recency bonus", () => {
    const recent = scoreLead({ ...baseInput, createdAt: new Date() });
    const old = scoreLead({ ...baseInput, createdAt: new Date("2024-01-01") });

    expect(recent.signals.recency).toBeGreaterThan(old.signals.recency);
  });

  it("should score repeat visitors", () => {
    const first = scoreLead({ ...baseInput, existingLeadCount: 0 });
    const second = scoreLead({ ...baseInput, existingLeadCount: 1 });
    const third = scoreLead({ ...baseInput, existingLeadCount: 3 });

    expect(first.signals.repeatVisitor).toBe(0);
    expect(second.signals.repeatVisitor).toBe(5);
    expect(third.signals.repeatVisitor).toBe(10);
  });

  it("should cap score at 100", () => {
    const result = scoreLead({
      leadType: "dealer_inquiry",
      yachtIds: "1,2,3,4,5,6",
      utmSource: "linkedin",
      utmMedium: "cpc",
      phone: "+1234567890",
      message: "We want to purchase multiple yachts for our Mediterranean fleet. Please contact us urgently.",
      email: "vip@example.com",
      createdAt: new Date(),
      existingLeadCount: 5,
    });
    expect(result.total).toBeLessThanOrEqual(100);
  });

  it("should categorize tiers correctly", () => {
    const hot = scoreLead({ ...baseInput, leadType: "dealer_inquiry", yachtIds: "1,2,3,4,5", phone: "+1", message: "Detailed inquiry message here for testing", utmMedium: "cpc" });
    const cold = scoreLead({ ...baseInput, leadType: "general", yachtIds: "", createdAt: new Date("2024-01-01") });

    expect(hot.tier).toBe("hot");
    expect(cold.tier).toBe("cold");
  });

  it("should generate explanation", () => {
    const result = scoreLead({ ...baseInput, leadType: "dealer_inquiry", phone: "+1" });
    const explanation = explainScore(result);
    expect(explanation).toContain("high-intent");
    expect(explanation).toContain("phone");
  });

  it("should handle null inputs gracefully", () => {
    const result = scoreLead({
      leadType: null,
      yachtIds: "",
      utmSource: null,
      utmMedium: null,
      phone: null,
      message: null,
      email: null,
      createdAt: null,
      existingLeadCount: 0,
    });
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.tier).toBeDefined();
  });
});
