/**
 * Country name to flag emoji mapping.
 * Shared between manufacturer listing and detail pages.
 */
export const COUNTRY_FLAGS: Record<string, string> = {
  Austria: "🇦🇹",
  Denmark: "🇩🇰",
  Finland: "🇫🇮",
  France: "🇫🇷",
  Germany: "🇩🇪",
  Italy: "🇮🇹",
  Netherlands: "🇳🇱",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  Slovenia: "🇸🇮",
  Sweden: "🇸🇪",
  "United Kingdom": "🇬🇧",
  "United States": "🇺🇸",
};

/**
 * Get the flag emoji for a country name.
 * Returns the flag emoji if found, otherwise an empty string.
 */
export function getCountryFlag(country: string | null): string {
  if (!country) return "";
  return COUNTRY_FLAGS[country] ?? "";
}
