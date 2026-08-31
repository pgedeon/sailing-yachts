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
 * Check if user is logged in by calling /api/auth/session.
 * Module-level in-flight dedupe: every FavoriteButton on a page calls this
 * hook; without sharing, a 20-yacht listing fired 20+ identical session
 * requests (observed 22x on /en/yachts 2026-08-31).
 */
let sessionUserIdPromise: Promise<string | null> | null = null;

function getSessionUserId(): Promise<string | null> {
  if (!sessionUserIdPromise) {
    sessionUserIdPromise = (async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) return null;
        const data = await res.json();
        return data?.user?.id || null;
      } catch {
        return null;
      }
    })();
  }
  return sessionUserIdPromise;
}

/**
 * Fetch DB favorites as slugs
 */
async function fetchDbFavorites(): Promise<string[]> {
  try {
    const res = await fetch("/api/user/favorites");
    if (!res.ok) return [];
    const data = await res.json();
    return (data.favorites || [])
      .map((f: any) => f.slug)
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Custom hook for managing favorites.
 * When user is authenticated, syncs with DB.
 * Falls back to localStorage for guests.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function init() {
      const userId = await getSessionUserId();
      if (userId) {
        setIsAuthenticated(true);
        const dbSlugs = await fetchDbFavorites();
        setFavorites(dbSlugs);
        // Also write to localStorage as backup
        writeFavorites(dbSlugs);
      } else {
        setIsAuthenticated(false);
        setFavorites(readFavorites());
      }
    }
    init();
  }, []);

  const isFavorite = useCallback(
    (slug: string) => favorites.includes(slug),
    [favorites],
  );

  const toggleFavorite = useCallback(async (slug: string) => {
    const current = isAuthenticated ? favorites : readFavorites();
    const isAdding = !current.includes(slug);

    let next: string[];
    if (isAdding) {
      if (current.length >= 50) return;
      next = [...current, slug];
    } else {
      next = current.filter((s) => s !== slug);
    }

    // Optimistic update
    setFavorites(next);
    writeFavorites(next);

    // Sync with DB if authenticated
    if (isAuthenticated) {
      try {
        if (isAdding) {
          // Need yacht model ID — fetch from slug
          const yachtRes = await fetch(`/api/yachts/${slug}`);
          if (yachtRes.ok) {
            const yacht = await yachtRes.json();
            await fetch("/api/user/favorites", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ yachtModelId: yacht.id }),
            });
          }
        } else {
          // Need yacht model ID
          const yachtRes = await fetch(`/api/yachts/${slug}`);
          if (yachtRes.ok) {
            const yacht = await yachtRes.json();
            await fetch(`/api/user/favorites?yachtModelId=${yacht.id}`, {
              method: "DELETE",
            });
          }
        }
      } catch {
        // Revert on error
        setFavorites(current);
        writeFavorites(current);
      }
    }
  }, [favorites, isAuthenticated]);

  const clearAll = useCallback(async () => {
    setFavorites([]);
    writeFavorites([]);
    // Note: DB clear not implemented — would need a DELETE all endpoint
  }, []);

  return { favorites, isFavorite, toggleFavorite, clearAll, count: favorites.length, isAuthenticated };
}

// Re-export localStorage utility functions for non-React usage
export { readFavorites, writeFavorites, STORAGE_KEY };
