import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * P13.4 — Form accessibility & error handling tests
 *
 * These tests verify:
 * 1. Newsletter signup: label, aria-describedby for errors, aria-live regions
 * 2. LeadForm: labels for all inputs, error announcements, aria-label on form
 * 3. Search input: aria-label, role=listbox on autocomplete, aria-live on results
 * 4. Compare picker: aria-label on search input, Escape handler
 * 5. Yachts listing: aria-live on results, role=region on results
 */
describe("P13.4: Form accessibility & error handling", () => {
  // ── NewsletterSignup ──
  describe("NewsletterSignup", () => {
    const component = fs.readFileSync(
      path.join(PROJECT_ROOT, "components/NewsletterSignup.tsx"),
      "utf-8",
    );

    it("has a label for the email input", () => {
      expect(component).toContain("<label");
      expect(component).toContain("Email address");
    });

    it("uses sr-only label for compact design", () => {
      expect(component).toContain("sr-only");
    });

    it("has aria-label on the form", () => {
      expect(component).toContain('aria-label="Newsletter signup"');
    });

    it("links error to input via aria-describedby", () => {
      expect(component).toContain("aria-describedby");
      expect(component).toContain("errorId");
    });

    it("marks input as aria-invalid on error", () => {
      expect(component).toContain("aria-invalid");
    });

    it("error message uses role=alert", () => {
      expect(component).toContain('role="alert"');
    });

    it("error message uses aria-live=assertive", () => {
      expect(component).toContain('aria-live="assertive"');
    });

    it("success message uses role=status", () => {
      expect(component).toContain('role="status"');
    });

    it("success message uses aria-live=polite", () => {
      expect(component).toContain('aria-live="polite"');
    });

    it("uses useId() for unique IDs", () => {
      expect(component).toContain("useId");
    });
  });

  // ── LeadForm ──
  describe("LeadForm", () => {
    const component = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/components/LeadForm.tsx"),
      "utf-8",
    );

    it("has labels for name input", () => {
      expect(component).toContain("<label");
      expect(component).toContain("Your name");
    });

    it("has labels for email input", () => {
      expect(component).toContain("Email address");
    });

    it("has labels for phone input", () => {
      expect(component).toContain("Phone number");
    });

    it("has labels for message textarea", () => {
      expect(component).toContain("Your message");
    });

    it("all labels use sr-only class", () => {
      const labelMatches = component.match(/<label[^>]*>/g);
      expect(labelMatches).toBeTruthy();
      for (const label of labelMatches!) {
        expect(label).toContain("sr-only");
      }
    });

    it("has aria-label on the form", () => {
      expect(component).toContain("aria-label=");
      expect(component).toContain("form");
    });

    it("links inputs to error via aria-describedby", () => {
      expect(component).toContain("aria-describedby");
      expect(component).toContain("errorId");
    });

    it("error message uses role=alert", () => {
      expect(component).toContain('role="alert"');
    });

    it("success message uses role=status with aria-live", () => {
      expect(component).toContain('role="status"');
      expect(component).toContain('aria-live="polite"');
    });

    it("trigger button has aria-expanded", () => {
      expect(component).toContain("aria-expanded");
    });

    it("uses useId() for unique IDs", () => {
      expect(component).toContain("useId");
    });
  });

  // ── SearchClient ──
  describe("SearchClient", () => {
    const component = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/search/SearchClient.tsx"),
      "utf-8",
    );

    it("search input has aria-label", () => {
      // After i18n refactor, the search heading is used as aria-label
      expect(component).toContain('aria-label={t("heading")}');
    });

    it("autocomplete suggestions have role=listbox", () => {
      expect(component).toContain('role="listbox"');
    });

    it("autocomplete suggestions have aria-label", () => {
      // After i18n refactor, aria-label uses translation key
      expect(component).toContain('aria-label={t("suggestions.label")}');
    });

    it("results region has aria-live", () => {
      expect(component).toContain('aria-live="polite"');
    });

    it("results region has aria-label", () => {
      expect(component).toContain('aria-label="Search results"');
    });

    it("no-results has role=status", () => {
      expect(component).toContain('role="status"');
    });
  });

  // ── CompareClient ──
  describe("CompareClient picker search", () => {
    const component = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/compare/CompareClient.tsx"),
      "utf-8",
    );

    it("picker search input has aria-label", () => {
      expect(component).toContain('aria-label="Search yachts to add to comparison"');
    });

    it("has Escape key handler for picker", () => {
      expect(component).toContain("Escape");
      expect(component).toContain("setPickerOpen(false)");
    });
  });

  // ── YachtsClient ──
  describe("YachtsClient results accessibility", () => {
    const component = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/yachts/YachtsClient.tsx"),
      "utf-8",
    );

    it("results grid has role=region", () => {
      expect(component).toContain('role="region"');
    });

    it("results grid has aria-live", () => {
      expect(component).toContain('aria-live="polite"');
    });

    it("results grid has aria-label", () => {
      expect(component).toContain('aria-label="Yacht listings"');
    });

    it("loading state has role=status", () => {
      expect(component).toContain('role="status"');
    });
  });
});
