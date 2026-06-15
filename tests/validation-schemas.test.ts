import { describe, it, expect } from "vitest";
import {
  emailYachtSchema,
  compareShareSchema,
  faqProposalActionSchema,
  quizAnswersSchema,
  revenueEventsSchema,
  affiliateTrackSchema,
  compareReportSchema,
  authRegisterSchema,
} from "@/lib/validations";

describe("P27.2: API Input Validation Schemas", () => {
  describe("emailYachtSchema", () => {
    it("accepts valid input", () => {
      const result = emailYachtSchema.safeParse({
        recipientEmail: "test@example.com",
        yachtSlug: "beneteau-oceanis-40",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid email", () => {
      const result = emailYachtSchema.safeParse({
        recipientEmail: "not-an-email",
        yachtSlug: "beneteau-oceanis-40",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing yacht slug", () => {
      const result = emailYachtSchema.safeParse({
        recipientEmail: "test@example.com",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("compareShareSchema", () => {
    it("accepts 2-4 yacht IDs", () => {
      expect(compareShareSchema.safeParse({ yachtIds: [1, 2] }).success).toBe(true);
      expect(compareShareSchema.safeParse({ yachtIds: [1, 2, 3, 4] }).success).toBe(true);
    });

    it("rejects less than 2 or more than 4 IDs", () => {
      expect(compareShareSchema.safeParse({ yachtIds: [1] }).success).toBe(false);
      expect(compareShareSchema.safeParse({ yachtIds: [1, 2, 3, 4, 5] }).success).toBe(false);
    });
  });

  describe("faqProposalActionSchema", () => {
    it("accepts create action with question", () => {
      const result = faqProposalActionSchema.safeParse({
        action: "create",
        question: "What is the best yacht?",
      });
      expect(result.success).toBe(true);
    });

    it("accepts harvest action", () => {
      const result = faqProposalActionSchema.safeParse({ action: "harvest" });
      expect(result.success).toBe(true);
    });

    it("defaults action to create", () => {
      const result = faqProposalActionSchema.safeParse({ question: "Test?" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.action).toBe("create");
      }
    });

    it("rejects invalid action", () => {
      const result = faqProposalActionSchema.safeParse({ action: "invalid_action" });
      expect(result.success).toBe(false);
    });
  });

  describe("quizAnswersSchema", () => {
    it("accepts valid answers", () => {
      const result = quizAnswersSchema.safeParse({
        experience: "beginner",
        sailingType: "cruising",
        crewSize: "2",
        budget: "low",
        preferredLength: "30-40",
        keelPreference: "fin",
        priority: "comfort",
      });
      expect(result.success).toBe(true);
    });

    it("accepts empty strings", () => {
      const result = quizAnswersSchema.safeParse({
        experience: "",
        sailingType: "",
        crewSize: "",
        budget: "",
        preferredLength: "",
        keelPreference: "",
        priority: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("revenueEventsSchema", () => {
    it("accepts valid events array", () => {
      const result = revenueEventsSchema.safeParse({
        events: [
          {
            type: "click",
            page: "/yachts",
            timestamp: "2026-06-15T10:00:00Z",
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty events array", () => {
      const result = revenueEventsSchema.safeParse({ events: [] });
      expect(result.success).toBe(false);
    });

    it("rejects more than 50 events", () => {
      const events = Array.from({ length: 51 }, (_, i) => ({
        type: "click",
        timestamp: Date.now(),
      }));
      const result = revenueEventsSchema.safeParse({ events });
      expect(result.success).toBe(false);
    });
  });

  describe("affiliateTrackSchema", () => {
    it("accepts valid click action", () => {
      const result = affiliateTrackSchema.safeParse({
        action: "click",
        variantId: 1,
        placementId: 2,
      });
      expect(result.success).toBe(true);
    });

    it("coerces string numbers to numbers", () => {
      const result = affiliateTrackSchema.safeParse({
        action: "click",
        variantId: "123",
        placementId: "456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.variantId).toBe("number");
      }
    });

    it("rejects missing required fields", () => {
      expect(affiliateTrackSchema.safeParse({ action: "click" }).success).toBe(false);
    });

    it("rejects invalid action", () => {
      const result = affiliateTrackSchema.safeParse({
        action: "view",
        variantId: "var-1",
        placementId: "plc-1",
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

    it("rejects invalid email", () => {
      const result = compareReportSchema.safeParse({
        email: "bad",
        yachtIds: [1, 2],
      });
      expect(result.success).toBe(false);
    });

    it("rejects less than 2 yacht IDs", () => {
      const result = compareReportSchema.safeParse({
        email: "user@example.com",
        yachtIds: [1],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("authRegisterSchema", () => {
    it("accepts valid registration", () => {
      const result = authRegisterSchema.safeParse({
        email: "user@example.com",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects short password", () => {
      const result = authRegisterSchema.safeParse({
        email: "user@example.com",
        password: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password over 72 chars", () => {
      const result = authRegisterSchema.safeParse({
        email: "user@example.com",
        password: "a".repeat(73),
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = authRegisterSchema.safeParse({
        email: "not-email",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });
  });
});
