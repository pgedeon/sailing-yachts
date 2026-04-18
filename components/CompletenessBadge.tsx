import React from "react";
import { getCompletenessLevel } from "@/lib/completeness";

interface CompletenessBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export default function CompletenessBadge({
  score,
  size = "sm",
  showLabel = false,
  className = "",
}: CompletenessBadgeProps) {
  const level = getCompletenessLevel(score);

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${level.bgColor} ${level.textColor} ${sizeClasses[size]} ${className}`}
      title={`Data completeness: ${score}% — ${level.label}`}
      data-testid="completeness-badge"
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${level.color}`}
        aria-hidden="true"
      />
      {score}%
      {showLabel && (
        <span className="hidden sm:inline opacity-75">· {level.label}</span>
      )}
    </span>
  );
}
