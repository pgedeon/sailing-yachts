"use client";

import React from "react";
import { useFavorites } from "@/lib/useFavorites";

interface FavoriteButtonProps {
  slug: string;
  modelName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function FavoriteButton({
  slug,
  modelName,
  className = "",
  size = "md",
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(slug);

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-11 h-11",
  };

  const iconSize = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-5.5 h-5.5",
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(slug);
      }}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${
        active
          ? "bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-600"
      } ${sizeClasses[size]} ${className}`}
      aria-label={active ? `Remove ${modelName || slug} from favorites` : `Add ${modelName || slug} to favorites`}
      title={active ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        className={iconSize[size]}
        fill={active ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
       aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span className="ml-1.5 text-sm font-medium">
          {active ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
}
