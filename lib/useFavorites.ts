"use client";

import React, { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "sailing-yachts-favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s: unknown) => typeof s === "string");
  } catch {
    return [];
  }
}

function writeFavorites(slugs: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // localStorage full
  }
}

/**
 * Custom hook for managing favorites.
 * Each component using this hook manages its own state but reads/writes the same localStorage key.
 * This avoids needing a global context that would require wrapping the entire app.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    setFavorites(readFavorites());
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback((slug: string) => {
    const current = readFavorites();
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : current.length >= 50
        ? current
        : [...current, slug];
    writeFavorites(next);
    setFavorites(next);
  }, []);

  const clearAll = useCallback(() => {
    writeFavorites([]);
    setFavorites([]);
  }, []);

  return { favorites, isFavorite, toggleFavorite, clearAll, count: favorites.length };
}

// Re-export localStorage utility functions for non-React usage
export { readFavorites, writeFavorites, STORAGE_KEY };
