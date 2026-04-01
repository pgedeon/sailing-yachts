"use client";

import { type PriceTierInfo } from "@/lib/price-tier";

interface PriceTierBadgeProps {
  info: PriceTierInfo;
  size?: "sm" | "md" | "lg";
}

export function PriceTierBadge({ info, size = "sm" }: PriceTierBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${info.bgColor} ${info.color} ${sizeClasses[size]}`}
      title={`Estimated price range: ${info.range}`}
    >
      {info.label}
    </span>
  );
}

interface PriceTierDetailProps {
  info: PriceTierInfo;
}

export function PriceTierDetail({ info }: PriceTierDetailProps) {
  if (info.tier === "unknown") return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-3">
        <h3 className="font-semibold text-gray-900">Estimated Price Range</h3>
        <PriceTierBadge info={info} size="md" />
      </div>
      <p className="text-lg font-bold text-gray-800 mb-2">{info.range}</p>
      <ul className="space-y-1">
        {info.reasons.map((reason, i) => (
          <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
            <span className="text-gray-400 mt-0.5">•</span>
            {reason}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-400 mt-3 italic">
        Estimate based on yacht specifications. Actual prices vary by market, condition, and equipment.
      </p>
    </div>
  );
}
