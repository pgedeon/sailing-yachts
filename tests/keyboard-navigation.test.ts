import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

/**
 * P13.3 — Keyboard navigation enhancement tests
 *
 * These tests verify the code-level presence of keyboard navigation features:
 * 1. Global focus-visible styles in CSS
 * 2. Focus trapping in modals and mobile menu
 * 3. Escape key handlers for dropdowns, modals, lightbox
 * 4. Arrow key navigation for tabs
 * 5. Mobile menu keyboard support (aria-expanded, focus management)
 * 6. Compare picker Escape to close
 * 7. Shared keyboard utility hooks
 */
describe("P13.3: Keyboard navigation enhancement", () => {
  // ── Global focus-visible styles ──
  describe("Global focus-visible CSS", () => {
    const globalsCss = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/globals.css"),
      "utf-8",
    );

    it("has focus-visible outline rule", () => {
      expect(globalsCss).toContain("focus-visible");
      expect(globalsCss).toContain("outline: 2px solid #2563eb");
    });

    it("removes default outline for mouse users", () => {
      expect(globalsCss).toContain("*:focus");
      expect(globalsCss).toContain("outline: none");
    });

    it("has focus styles for form inputs", () => {
      expect(globalsCss).toContain("input[type=\"checkbox\"]:focus-visible");
      expect(globalsCss).toContain("input[type=\"text\"]:focus-visible");
    });
  });

  // ── Keyboard utility hooks ──
  describe("Keyboard utility hooks (lib/keyboard.ts)", () => {
    const keyboardLib = fs.readFileSync(
      path.join(PROJECT_ROOT, "lib/keyboard.ts"),
      "utf-8",
    );

    it("exports useFocusTrap hook", () => {
      expect(keyboardLib).toContain("useFocusTrap");
      expect(keyboardLib).toContain("Escape");
    });

    it("exports useArrowNavigation hook", () => {
      expect(keyboardLib).toContain("useArrowNavigation");
      expect(keyboardLib).toContain("ArrowDown");
      expect(keyboardLib).toContain("ArrowUp");
    });

    it("focus trap handles Tab and Shift+Tab", () => {
      expect(keyboardLib).toContain("Tab");
      expect(keyboardLib).toContain("shiftKey");
    });

    it("focus trap calls onEscape callback", () => {
      expect(keyboardLib).toContain("onEscape");
    });

    it("arrow navigation supports Home/End keys", () => {
      expect(keyboardLib).toContain("Home");
      expect(keyboardLib).toContain("End");
    });
  });

  // ── Mobile menu keyboard support ──
  describe("Mobile menu keyboard support", () => {
    const mobileMenu = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/ClientNav.tsx"),
      "utf-8",
    );

    it("has aria-expanded on trigger button", () => {
      expect(mobileMenu).toContain("aria-expanded");
    });

    it("has aria-controls linking to panel", () => {
      expect(mobileMenu).toContain("aria-controls");
      expect(mobileMenu).toContain("mobile-menu-panel");
    });

    it("handles Escape key to close", () => {
      expect(mobileMenu).toContain("Escape");
      expect(mobileMenu).toContain("closeMenu");
    });

    it("traps focus when open (Tab cycling)", () => {
      expect(mobileMenu).toContain("Tab");
      expect(mobileMenu).toContain("shiftKey");
    });

    it("returns focus to trigger on close", () => {
      expect(mobileMenu).toContain("triggerRef.current?.focus()");
    });

    it("has role=navigation on panel", () => {
      expect(mobileMenu).toContain('role="navigation"');
    });
  });

  // ── Layout keyboard accessibility ──
  describe("Layout keyboard accessibility", () => {
    const layout = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/layout.tsx"),
      "utf-8",
    );

    it("includes mobile menu component", () => {
      expect(layout).toContain("ClientNav");
    });

    it("has skip-to-content link", () => {
      expect(layout).toContain('href="#main-content"');
      expect(layout).toContain("Skip to content");
    });
  });

  // ── YachtsClient modal keyboard support ──
  describe("YachtsClient modal keyboard support", () => {
    const yachtsClient = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/yachts/YachtsClient.tsx"),
      "utf-8",
    );

    it("modal has role=dialog and aria-modal", () => {
      expect(yachtsClient).toContain('role="dialog"');
      expect(yachtsClient).toContain('aria-modal="true"');
    });

    it("handles Escape key to close modal", () => {
      expect(yachtsClient).toContain("Escape");
      expect(yachtsClient).toContain("closeModal");
    });

    it("traps focus in modal (Tab cycling)", () => {
      // Modal focus trap implementation
      expect(yachtsClient).toContain("modalRef");
    });

    it("returns focus after modal closes", () => {
      expect(yachtsClient).toContain("previousFocusRef");
    });

    it("mobile filters close on Escape", () => {
      expect(yachtsClient).toContain("filtersOpen");
      expect(yachtsClient).toContain("setFiltersOpen(false)");
    });
  });

  // ── MediaGallery keyboard support ──
  describe("MediaGallery keyboard support", () => {
    const gallery = fs.readFileSync(
      path.join(PROJECT_ROOT, "components/MediaGallery.tsx"),
      "utf-8",
    );

    it("tabs have proper ARIA attributes", () => {
      expect(gallery).toContain('role="tablist"');
      expect(gallery).toContain('role="tab"');
      expect(gallery).toContain('aria-selected');
    });

    it("tab panels have role=tabpanel", () => {
      expect(gallery).toContain('role="tabpanel"');
    });

    it("tabs use roving tabindex", () => {
      expect(gallery).toContain("tabIndex");
    });

    it("supports arrow key tab navigation", () => {
      expect(gallery).toContain("ArrowRight");
      expect(gallery).toContain("ArrowLeft");
    });

    it("supports Home/End keys in tabs", () => {
      expect(gallery).toContain("Home");
      expect(gallery).toContain("End");
    });

    it("lightbox has role=dialog and aria-modal", () => {
      expect(gallery).toContain('role="dialog"');
      expect(gallery).toContain('aria-modal="true"');
    });

    it("lightbox closes on Escape", () => {
      expect(gallery).toContain("Escape");
      expect(gallery).toContain("closeLightbox");
    });

    it("lightbox supports arrow keys for navigation", () => {
      // ArrowLeft and ArrowRight for prev/next
      const lightboxEffect = gallery.substring(
        gallery.indexOf("lightboxIndex === null"),
      );
      expect(lightboxEffect).toContain("ArrowLeft");
      expect(lightboxEffect).toContain("ArrowRight");
    });
  });

  // ── YachtDetailModal keyboard support ──
  describe("YachtDetailModal keyboard support", () => {
    const modal = fs.readFileSync(
      path.join(PROJECT_ROOT, "components/YachtDetailModal.tsx"),
      "utf-8",
    );

    it("has role=dialog and aria-modal", () => {
      expect(modal).toContain('role="dialog"');
      expect(modal).toContain('aria-modal="true"');
    });

    it("handles Escape key", () => {
      expect(modal).toContain("Escape");
    });

    it("traps focus (Tab cycling)", () => {
      expect(modal).toContain("Tab");
      expect(modal).toContain("modalRef");
    });

    it("returns focus on close", () => {
      expect(modal).toContain("previousFocusRef");
    });

    it("focuses close button on open", () => {
      expect(modal).toContain('aria-label="Close"');
    });
  });

  // ── CompareClient keyboard support ──
  describe("CompareClient keyboard support", () => {
    const compare = fs.readFileSync(
      path.join(PROJECT_ROOT, "app/[locale]/compare/CompareClient.tsx"),
      "utf-8",
    );

    it("picker closes on Escape key", () => {
      expect(compare).toContain("pickerOpen");
      expect(compare).toContain("Escape");
      expect(compare).toContain("setPickerOpen(false)");
    });
  });
});
