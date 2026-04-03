"use client";

import { useState } from "react";

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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

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
            ? "You're already subscribed!"
            : "Thanks for subscribing! We'll notify you when new yachts are added.",
        );
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div
        className={`text-center ${compact ? "py-3" : "py-6"} ${className}`}
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            Get notified when new yachts are added to the database.
          </p>
        </>
      )}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            compact ? "Your email for updates" : "Enter your email address"
          }
          required
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
          {status === "loading" ? "..." : compact ? "Subscribe" : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-600 text-sm mt-2">{message}</p>
      )}
    </div>
  );
}
