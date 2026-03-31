/**
 * Saved comparisons stored in localStorage.
 * Each comparison has a name, array of yacht IDs, and a timestamp.
 */

export interface SavedComparison {
  id: string;
  name: string;
  yachtIds: number[];
  createdAt: string;
}

const STORAGE_KEY = "sailing-yachts-saved-comparisons";
const MAX_SAVED = 20;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function getSavedComparisons(): SavedComparison[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveComparison(name: string, yachtIds: number[]): SavedComparison | null {
  if (!name.trim() || yachtIds.length < 2) return null;
  const saved = getSavedComparisons();
  if (saved.length >= MAX_SAVED) return null;

  const entry: SavedComparison = {
    id: generateId(),
    name: name.trim(),
    yachtIds: yachtIds.slice(0, 4),
    createdAt: new Date().toISOString(),
  };

  saved.push(entry);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    return null;
  }
  return entry;
}

export function deleteComparison(id: string): boolean {
  const saved = getSavedComparisons();
  const filtered = saved.filter((c) => c.id !== id);
  if (filtered.length === saved.length) return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

export function getShareUrl(yachtIds: number[]): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.origin + "/compare");
  url.searchParams.set("ids", yachtIds.join(","));
  return url.toString();
}
