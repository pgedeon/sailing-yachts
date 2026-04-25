"use client";

import { useState } from "react";
import { Star, Plus, X, Send, CheckCircle } from "lucide-react";

interface ReviewSubmissionFormProps {
  yachtModelId: number;
  yachtName: string;
}

const REVIEWER_TYPES = [
  { value: "owner", label: "Current Owner" },
  { value: "previous_owner", label: "Previous Owner" },
  { value: "sailed_on", label: "Sailed On" },
  { value: "broker", label: "Broker/Dealer" },
  { value: "considering", label: "Considering Purchase" },
] as const;

function StarSelector({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(0);
  const sizeClass = size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={`${sizeClass} transition-colors ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground/30"
            } hover:scale-110`}
           aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function BreakdownSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-40 shrink-0">{label}</span>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value || 3}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-yellow-400"
      />
      <span className="text-sm font-medium w-6 text-center">
        {value || "—"}
      </span>
    </div>
  );
}

export function ReviewSubmissionForm({ yachtModelId, yachtName }: ReviewSubmissionFormProps) {
  const [rating, setRating] = useState(0);
  const [summary, setSummary] = useState("");
  const [fullText, setFullText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [reviewerType, setReviewerType] = useState<string>("considering");
  const [pros, setPros] = useState<string[]>([]);
  const [cons, setCons] = useState<string[]>([]);
  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");
  const [breakdown, setBreakdown] = useState({
    build_quality: 0,
    sailing_performance: 0,
    comfort: 0,
    value_for_money: 0,
  });
  // Honeypot
  const [honeypot, setHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPro = () => {
    const v = proInput.trim();
    if (v && pros.length < 10) {
      setPros([...pros, v]);
      setProInput("");
    }
  };
  const removePro = (idx: number) => setPros(pros.filter((_, i) => i !== idx));

  const addCon = () => {
    const v = conInput.trim();
    if (v && cons.length < 10) {
      setCons([...cons, v]);
      setConInput("");
    }
  };
  const removeCon = (idx: number) => setCons(cons.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }
    if (honeypot) return; // bot detected

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        yachtModelId,
        reviewerType,
        rating,
        summary,
        fullText: fullText || null,
        authorName,
        ratingBreakdown: {
          build_quality: breakdown.build_quality || null,
          sailing_performance: breakdown.sailing_performance || null,
          comfort: breakdown.comfort || null,
          value_for_money: breakdown.value_for_money || null,
        },
        pros,
        cons,
      };

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 sm:p-8 text-center" data-testid="review-submitted">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4"  aria-hidden="true" />
        <h3 className="text-lg font-bold mb-2">Thank you for your review!</h3>
        <p className="text-muted-foreground">
          Your review of the {yachtName} has been submitted and will be visible after moderation.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-6 sm:p-8"
      data-testid="review-submission-form"
    >
      <h2 className="text-lg sm:text-xl font-bold mb-6">Write a Review</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Share your experience with the {yachtName}
      </p>

      {/* Honeypot - hidden from humans */}
      <div className="absolute opacity-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="reviewer-name" className="block text-sm font-medium mb-1.5">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="reviewer-name"
            type="text"
            required
            maxLength={200}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="John D."
          />
        </div>

        {/* Reviewer type */}
        <div>
          <label htmlFor="reviewer-type" className="block text-sm font-medium mb-1.5">
            Your Relationship with This Boat
          </label>
          <select
            id="reviewer-type"
            value={reviewerType}
            onChange={(e) => setReviewerType(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {REVIEWER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rating */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <StarSelector value={rating} onChange={setRating}  aria-hidden="true" />
        </div>

        {/* Summary */}
        <div>
          <label htmlFor="review-summary" className="block text-sm font-medium mb-1.5">
            Summary <span className="text-red-500">*</span>
          </label>
          <input
            id="review-summary"
            type="text"
            required
            minLength={5}
            maxLength={500}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Brief summary of your experience"
          />
        </div>

        {/* Full review */}
        <div>
          <label htmlFor="review-full" className="block text-sm font-medium mb-1.5">
            Full Review <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            id="review-full"
            maxLength={5000}
            rows={4}
            value={fullText}
            onChange={(e) => setFullText(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
            placeholder="Share the details of your experience..."
          />
        </div>

        {/* Rating breakdown */}
        <div>
          <h3 className="text-sm font-medium mb-3">
            Detailed Ratings <span className="text-muted-foreground">(optional)</span>
          </h3>
          <div className="space-y-2">
            <BreakdownSlider
              label="Build Quality"
              value={breakdown.build_quality}
              onChange={(v) => setBreakdown({ ...breakdown, build_quality: v })}
            />
            <BreakdownSlider
              label="Sailing Performance"
              value={breakdown.sailing_performance}
              onChange={(v) => setBreakdown({ ...breakdown, sailing_performance: v })}
            />
            <BreakdownSlider
              label="Comfort"
              value={breakdown.comfort}
              onChange={(v) => setBreakdown({ ...breakdown, comfort: v })}
            />
            <BreakdownSlider
              label="Value for Money"
              value={breakdown.value_for_money}
              onChange={(v) => setBreakdown({ ...breakdown, value_for_money: v })}
            />
          </div>
        </div>

        {/* Pros */}
        <div>
          <h3 className="text-sm font-medium mb-2">Pros</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              maxLength={200}
              value={proInput}
              onChange={(e) => setProInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPro();
                }
              }}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Add a pro..."
            />
            <button
              type="button"
              onClick={addPro}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4"  aria-hidden="true" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pros.map((pro, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700"
              >
                {pro}
                <button
                  type="button"
                  onClick={() => removePro(idx)}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="h-3 w-3"  aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Cons */}
        <div>
          <h3 className="text-sm font-medium mb-2">Cons</h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              maxLength={200}
              value={conInput}
              onChange={(e) => setConInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCon();
                }
              }}
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Add a con..."
            />
            <button
              type="button"
              onClick={addCon}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Plus className="h-4 w-4"  aria-hidden="true" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cons.map((con, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700"
              >
                {con}
                <button
                  type="button"
                  onClick={() => removeCon(idx)}
                  className="ml-1 hover:text-red-900"
                >
                  <X className="h-3 w-3"  aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-review-btn"
        >
          <Send className="h-4 w-4"  aria-hidden="true" />
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}
