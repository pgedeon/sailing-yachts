"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface LeadFormProps {
  yachtIds: number[];
  leadType: "dealer_inquiry" | "price_request" | "find_similar" | "general";
  yachtName?: string;
  className?: string;
}

const FORM_CONFIG: Record<string, { title: string; buttonText: string; placeholder: string; icon: string }> = {
  dealer_inquiry: {
    title: "Ask a Dealer",
    buttonText: "Send Inquiry",
    placeholder: "I'm interested in learning more about this yacht...",
    icon: "📞",
  },
  price_request: {
    title: "Request Market Pricing",
    buttonText: "Get Pricing",
    placeholder: "I'd like to receive current market pricing for this yacht...",
    icon: "💰",
  },
  find_similar: {
    title: "Find Similar Yachts",
    buttonText: "Find Similar",
    placeholder: "I'm looking for yachts similar to these. My preferences are...",
    icon: "🔍",
  },
  general: {
    title: "Get in Touch",
    buttonText: "Submit",
    placeholder: "Your message...",
    icon: "✉️",
  },
};

export function LeadForm({ yachtIds, leadType, yachtName, className = "" }: LeadFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const config = FORM_CONFIG[leadType];

  useEffect(() => {
    // Capture UTM params from URL
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign"];
    utmKeys.forEach((key) => {
      const value = params.get(key);
      if (value) sessionStorage.setItem(key, value);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);

    try {
      const utmSource = sessionStorage.getItem("utm_source") || undefined;
      const utmMedium = sessionStorage.getItem("utm_medium") || undefined;
      const utmCampaign = sessionStorage.getItem("utm_campaign") || undefined;

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          message: message || undefined,
          yachtIds: yachtIds.join(","),
          leadType,
          pageUrl: window.location.href,
          referrer: document.referrer || undefined,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message });
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setResult({ success: false, message: data.error || "Submission failed" });
      }
    } catch {
      setResult({ success: false, message: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (result?.success) {
    return (
      <div className={`rounded-lg border border-green-200 bg-green-50 p-4 ${className}`}>
        <p className="text-green-800 font-medium">✓ {result.message}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {!showForm ? (
        <Button
          variant="outline"
          onClick={() => setShowForm(true)}
          className="w-full"
        >
          <span className="mr-2">{config.icon}</span>
          {config.title}
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4 bg-gray-50">
          <h4 className="font-semibold text-sm">
            {config.icon} {config.title}
            {yachtName && <span className="font-normal text-gray-500 ml-1">— {yachtName}</span>}
          </h4>

          <input
            type="text"
            placeholder="Your name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <textarea
            placeholder={config.placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full rounded border px-3 py-2 text-sm"
          />

          {result && !result.success && (
            <p className="text-red-600 text-sm">{result.message}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting} size="sm">
              {submitting ? "Sending..." : config.buttonText}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
