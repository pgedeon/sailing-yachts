/**
 * Returns a human-readable relative time string like "3 days ago"
 * Uses built-in Intl.RelativeTimeFormat — no external dependencies.
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    return rtf.format(-diffMins, "minute");
  }
  if (diffHours < 24) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    return rtf.format(-diffHours, "hour");
  }
  if (diffDays < 7) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    return rtf.format(-diffDays, "day");
  }
  if (diffWeeks < 5) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    return rtf.format(-diffWeeks, "week");
  }
  if (diffMonths < 12) {
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
    return rtf.format(-diffMonths, "month");
  }
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });
  return rtf.format(-diffYears, "year");
}