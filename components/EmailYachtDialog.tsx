"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Mail, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface EmailYachtDialogProps {
  yachtSlug: string;
  yachtName: string;
  isOpen: boolean;
  onClose: () => void;
}

type FormState = "idle" | "sending" | "success" | "error" | "rateLimited";

export function EmailYachtDialog({
  yachtSlug,
  yachtName,
  isOpen,
  onClose,
}: EmailYachtDialogProps) {
  const t = useTranslations("EmailYacht");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setFormState("idle");
    setRecipientEmail("");
    setSenderName("");
    setMessage("");
    setErrorMessage("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    setErrorMessage("");

    try {
      const locale = window.location.pathname.split("/")[1] || "en";
      const response = await fetch("/api/email-yacht", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          senderName: senderName.trim() || undefined,
          message: message.trim() || undefined,
          yachtSlug,
          locale,
        }),
      });

      const data = await response.json();

      if (response.status === 429) {
        setFormState("rateLimited");
        return;
      }

      if (!response.ok) {
        setFormState("error");
        setErrorMessage(data.error || t("errorMessage"));
        return;
      }

      setFormState("success");
    } catch {
      setFormState("error");
      setErrorMessage(t("errorMessage"));
    }
  };

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim());
  const canSend = formState === "idle" && isValidEmail;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-yacht-title"
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        {formState === "success" ? (
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" aria-hidden="true" />
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-white">
              {t("successTitle")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("successMessage", { email: recipientEmail })}
            </p>
            <button
              onClick={handleClose}
              className="mt-4 rounded-lg bg-gray-100 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              </div>
              <div>
                <h2
                  id="email-yacht-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {t("dialogTitle")}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {yachtName}
                </p>
              </div>
            </div>

            {formState === "rateLimited" ? (
              <div className="rounded-lg bg-amber-50 p-4 dark:bg-amber-900/20">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {t("rateLimitError")}
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 dark:text-amber-300"
                >
                  OK
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Recipient email */}
                <div>
                  <label
                    htmlFor="email-recipient"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("recipientLabel")} *
                  </label>
                  <input
                    id="email-recipient"
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder={t("recipientPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={formState === "sending"}
                  />
                </div>

                {/* Sender name */}
                <div>
                  <label
                    htmlFor="email-sender"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("senderLabel")}
                  </label>
                  <input
                    id="email-sender"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={t("senderPlaceholder")}
                    maxLength={100}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={formState === "sending"}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="email-message"
                    className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("messageLabel")}
                  </label>
                  <textarea
                    id="email-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("messagePlaceholder")}
                    maxLength={500}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    disabled={formState === "sending"}
                  />
                  <p className="mt-1 text-right text-xs text-gray-400">
                    {message.length}/500
                  </p>
                </div>

                {/* Error message */}
                {formState === "error" && errorMessage && (
                  <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSend}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formState === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("sending")}
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" aria-hidden="true" />
                      {t("sendButton")}
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
