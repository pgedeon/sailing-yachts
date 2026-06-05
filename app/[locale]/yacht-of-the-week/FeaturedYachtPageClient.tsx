"use client";

import { useState } from "react";

export function FeaturedYachtPageClient({ locale }: { locale: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "yacht-of-the-week" }),
      });

      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-green-700 font-medium">
        {locale === "fr" ? "Merci ! Vous recevrez nos prochains yachts vedettes." : "Thanks! You'll receive our next featured yachts."}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={locale === "fr" ? "votre@email.com" : "your@email.com"}
        className="flex-1 border rounded-lg px-4 py-2 text-sm"
        required
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {status === "loading"
          ? locale === "fr" ? "Envoi..." : "Subscribing..."
          : locale === "fr" ? "S'abonner" : "Subscribe"}
      </button>
    </form>
  );
}
