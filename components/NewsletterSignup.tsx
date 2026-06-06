"use client";

import { useState, useId } from "react";
import { useTranslations } from "next-intl";

interface NewsletterSignupProps {
  source?: string;
  className?: string;
  compact?: boolean;
}

export default function NewsletterSignup({
  source = "website",
  className = "",
  compact = false,
}: NewsletterSignupProps) {
  const t = useTranslations("Newsletter");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const inputId = useId();
  const errorId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(
          data.alreadySubscribed
            ? t("alreadySubscribed")
            : t("successMessage"),
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || t("errorMessage"));
      }
    } catch {
      setStatus("error");
      setMessage(t("networkError"));
    }
  };

  if (status === "success") {
    return (
      <div
        className={`text-center ${compact ? "py-3" : "py-6"} ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="text-2xl mb-2">⚓</div>
        <p className="text-green-700 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {!compact && (
        <>
          <h3 className="text-xl font-bold text-gray-900 mb-2" id={`${inputId}-title`}>
            {t("heading")}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {t("description")}
          </p>
        </>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2" aria-label={t("formLabel")}>
        {/* Screen-reader-only label */}
        <label htmlFor={inputId} className="sr-only">
          {t("emailLabel")}
        </label>
        <input
          id={inputId}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={compact ? t("placeholderCompact") : t("placeholder")}
          required
          aria-describedby={status === "error" ? errorId : undefined}
          aria-invalid={status === "error"}
          className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
            compact ? "text-sm" : ""
          }`}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading" || !email.trim()}
          className={`px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition whitespace-nowrap ${
            compact ? "text-sm" : ""
          }`}
        >
          {status === "loading" ? "..." : t("subscribe")}
        </button>
      </form>
      {status === "error" && (
        <p id={errorId} className="text-red-600 text-sm mt-2" role="alert" aria-live="assertive">
          {message}
        </p>
      )}
    </div>
  );
}
