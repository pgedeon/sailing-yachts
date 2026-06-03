"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";

interface StarRatingInputProps {
  /** Current user rating (if any) */
  value: number | null;
  /** Called when user selects a rating */
  onChange: (score: number) => void;
  /** Whether submission is in progress */
  disabled?: boolean;
  /** Size of stars */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
}: StarRatingInputProps) {
  const t = useTranslations("Ratings");
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue ?? value ?? 0;

  return (
    <div
      className="star-rating-input inline-flex items-center gap-0.5"
      role="radiogroup"
      aria-label={t("rateThisYacht")}
      onMouseLeave={() => setHoverValue(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          className={`p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm ${
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-110"
          }`}
          role="radio"
          aria-checked={value === star}
          aria-label={t("starCount", { count: star })}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= displayValue
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/30"
            } transition-colors`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}
