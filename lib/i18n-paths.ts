/**
 * Build locale-prefixed paths for internal navigation.
 *
 * Usage in server components:
 *   import { localePath } from "@/lib/i18n-paths";
 *   href={localePath(locale, "/yachts")}
 *
 * Usage in client components:
 *   import { useLocalePath } from "@/lib/i18n-paths";
 *   const lp = useLocalePath();
 *   href={lp("/yachts")}
 */

/**
 * Create a locale-prefixed path.
 * @param locale - The current locale (e.g., "en", "fr")
 * @param path - The internal path (e.g., "/yachts", "/compare")
 * @returns The locale-prefixed path (e.g., "/en/yachts")
 */
export function localePath(locale: string, path: string): string {
  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${cleanPath}`;
}

/**
 * Client-side hook-friendly path builder.
 * Returns a function that prepends the current locale to paths.
 */
export function buildLocalePath(locale: string): (path: string) => string {
  return (path: string) => localePath(locale, path);
}
