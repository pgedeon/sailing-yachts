import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(__dirname, "..");

describe("Email Yacht Feature — P23.3", () => {
  // --- Components ---
  describe("EmailYachtDialog component", () => {
    const componentPath = resolve(projectRoot, "components/EmailYachtDialog.tsx");

    it("file exists", () => {
      expect(existsSync(componentPath)).toBe(true);
    });

    it("exports named EmailYachtDialog", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("export function EmailYachtDialog");
    });

    it("is a client component", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('"use client"');
    });

    it("uses EmailYacht translation namespace", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('useTranslations("EmailYacht")');
    });

    it("has recipient email input field", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('id="email-recipient"');
      expect(content).toContain("type=\"email\"");
    });

    it("has sender name input field", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('id="email-sender"');
    });

    it("has optional message textarea", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('id="email-message"');
      expect(content).toContain("maxLength={500}");
    });

    it("has form states: idle, sending, success, error, rateLimited", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('"idle"');
      expect(content).toContain('"sending"');
      expect(content).toContain('"success"');
      expect(content).toContain('"error"');
      expect(content).toContain('"rateLimited"');
    });

    it("calls POST /api/email-yacht", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('"/api/email-yacht"');
      expect(content).toContain('"POST"');
    });

    it("sends yachtSlug in request body", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("yachtSlug");
    });

    it("shows success state with checkmark", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("CheckCircle");
      expect(content).toContain('"success"');
    });

    it("shows loading spinner during send", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("Loader2");
      expect(content).toContain("animate-spin");
    });

    it("has modal dialog with aria-modal", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('role="dialog"');
    });

    it("disables submit during sending", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("disabled={formState === \"sending\"}");
    });

    it("has close button with X icon", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("aria-label=\"Close\"");
    });
  });

  describe("EmailYachtButton component", () => {
    const componentPath = resolve(projectRoot, "components/EmailYachtButton.tsx");

    it("file exists", () => {
      expect(existsSync(componentPath)).toBe(true);
    });

    it("exports named EmailYachtButton", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("export function EmailYachtButton");
    });

    it("is a client component", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('"use client"');
    });

    it("uses EmailYacht translation namespace", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain('useTranslations("EmailYacht")');
    });

    it("renders a mail icon", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("Mail");
    });

    it("toggles dialog on click", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("setIsOpen(true)");
      expect(content).toContain("onClose");
    });

    it("accepts yachtSlug and yachtName props", () => {
      const content = readFileSync(componentPath, "utf-8");
      expect(content).toContain("yachtSlug");
      expect(content).toContain("yachtName");
    });
  });

  // --- API Route ---
  describe("POST /api/email-yacht route", () => {
    const routePath = resolve(projectRoot, "app/api/email-yacht/route.ts");

    it("file exists", () => {
      expect(existsSync(routePath)).toBe(true);
    });

    it("exports POST handler", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("export async function POST");
    });

    it("validates recipient email", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("recipientEmail");
      expect(content).toContain("emailRegex");
    });

    it("validates message length <= 500", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("500");
    });

    it("has rate limiting", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("rateLimiter");
      expect(content).toContain("MAX_EMAILS_PER_HOUR");
      expect(content).toContain("429");
    });

    it("fetches yacht data for email content", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("getYachtDetailData");
    });

    it("sends email via sendEmail utility", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("sendEmail");
    });

    it("builds HTML email template", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("buildEmailHtml");
    });

    it("builds plain text email fallback", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("buildEmailText");
    });

    it("supports French locale in email content", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("fr");
      expect(content).toContain("isFr");
      expect(content).toContain("Longueur hors tout");
    });

    it("includes yacht specs in email", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("lengthOverall");
      expect(content).toContain("beam");
      expect(content).toContain("draft");
      expect(content).toContain("displacement");
    });

    it("includes CTA link to yacht page", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("yachtUrl");
    });

    it("returns 404 for invalid yacht slug", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain('"Yacht not found"');
      expect(content).toContain("404");
    });

    it("returns 429 when rate limited", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("429");
    });

    it("escapes HTML in message to prevent XSS", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("escapeHtml");
    });

    it("supports personal message in email", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("message");
    });

    it("gets client IP for rate limiting", () => {
      const content = readFileSync(routePath, "utf-8");
      expect(content).toContain("x-forwarded-for");
    });
  });

  // --- Integration with Yacht Detail Page ---
  describe("Yacht detail page integration", () => {
    const detailPath = resolve(projectRoot, "app/[locale]/yachts/[slug]/YachtDetailClient.tsx");

    it("lazy-loads EmailYachtButton component", () => {
      const content = readFileSync(detailPath, "utf-8");
      expect(content).toContain("EmailYachtButton");
      expect(content).toContain("dynamic(");
    });

    it("passes yachtSlug and yachtName to EmailYachtButton", () => {
      const content = readFileSync(detailPath, "utf-8");
      expect(content).toMatch(/yachtSlug=\{slug\}/);
      expect(content).toMatch(/yachtName=/);
    });
  });

  // --- i18n ---
  describe("i18n translations", () => {
    const enPath = resolve(projectRoot, "messages/en.json");
    const frPath = resolve(projectRoot, "messages/fr.json");

    const requiredKeys = [
      "button", "dialogTitle", "recipientLabel", "recipientPlaceholder",
      "recipientRequired", "senderLabel", "senderPlaceholder",
      "messageLabel", "messagePlaceholder", "sendButton", "sending",
      "successTitle", "successMessage", "errorTitle", "errorMessage",
      "rateLimitError", "subject", "subjectNoSender",
    ];

    it("English translations exist with all keys", () => {
      const en = JSON.parse(readFileSync(enPath, "utf-8"));
      const emailYacht = en.EmailYacht;
      expect(emailYacht).toBeDefined();
      for (const key of requiredKeys) {
        expect(emailYacht[key]).toBeDefined();
        expect(typeof emailYacht[key]).toBe("string");
        expect(emailYacht[key].length).toBeGreaterThan(0);
      }
    });

    it("French translations exist with all keys", () => {
      const fr = JSON.parse(readFileSync(frPath, "utf-8"));
      const emailYacht = fr.EmailYacht;
      expect(emailYacht).toBeDefined();
      for (const key of requiredKeys) {
        expect(emailYacht[key]).toBeDefined();
        expect(typeof emailYacht[key]).toBe("string");
        expect(emailYacht[key].length).toBeGreaterThan(0);
      }
    });

    it("successMessage uses {email} interpolation", () => {
      const en = JSON.parse(readFileSync(enPath, "utf-8"));
      expect(en.EmailYacht.successMessage).toContain("{email}");
      const fr = JSON.parse(readFileSync(frPath, "utf-8"));
      expect(fr.EmailYacht.successMessage).toContain("{email}");
    });

    it("subject uses interpolation", () => {
      const en = JSON.parse(readFileSync(enPath, "utf-8"));
      expect(en.EmailYacht.subject).toContain("{sender}");
      expect(en.EmailYacht.subject).toContain("{manufacturer}");
      expect(en.EmailYacht.subject).toContain("{model}");
    });
  });
});
