/**
 * Exchange Rates Service (P10.6)
 *
 * Manages currency conversion for regional price normalization.
 * Rates are fetched from a free API and cached in the DB for 24h.
 * Supports EUR, USD, GBP as primary currencies.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";

// --- Types ---

export type CurrencyCode = "USD" | "EUR" | "GBP";

export interface ExchangeRate {
  id: number;
  baseCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  source: string;
  fetchedAt: Date;
}

// --- Constants ---

const SUPPORTED_CURRENCIES: CurrencyCode[] = ["USD", "EUR", "GBP"];

// Hardcoded fallback rates (updated periodically — these are approximations)
const FALLBACK_RATES: Record<string, number> = {
  "USD_EUR": 0.92,
  "USD_GBP": 0.79,
  "EUR_USD": 1.09,
  "EUR_GBP": 0.86,
  "GBP_USD": 1.27,
  "GBP_EUR": 1.16,
  "USD_USD": 1,
  "EUR_EUR": 1,
  "GBP_GBP": 1,
};

const RATE_STALE_HOURS = 24;

// --- DB Initialization ---

export async function ensureExchangeRatesTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id SERIAL PRIMARY KEY,
      base_currency VARCHAR(3) NOT NULL,
      target_currency VARCHAR(3) NOT NULL,
      rate NUMERIC(12,6) NOT NULL,
      source VARCHAR(100) NOT NULL DEFAULT 'fallback',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(base_currency, target_currency)
    )
  `);
}

// --- Rate Fetching ---

/**
 * Fetch latest exchange rates from a free API.
 * Falls back to hardcoded rates if the API is unavailable.
 */
async function fetchRatesFromApi(): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    const data = await response.json();
    if (!data.rates) throw new Error("No rates in response");

    const usdRates = data.rates;
    return {
      "USD_EUR": usdRates.EUR || FALLBACK_RATES["USD_EUR"],
      "USD_GBP": usdRates.GBP || FALLBACK_RATES["USD_GBP"],
      "EUR_USD": 1 / (usdRates.EUR || FALLBACK_RATES["USD_EUR"]),
      "EUR_GBP": (usdRates.GBP || FALLBACK_RATES["USD_GBP"]) / (usdRates.EUR || FALLBACK_RATES["USD_EUR"]),
      "GBP_USD": 1 / (usdRates.GBP || FALLBACK_RATES["USD_GBP"]),
      "GBP_EUR": (usdRates.EUR || FALLBACK_RATES["USD_EUR"]) / (usdRates.GBP || FALLBACK_RATES["USD_GBP"]),
      "USD_USD": 1,
      "EUR_EUR": 1,
      "GBP_GBP": 1,
    };
  } catch (error) {
    console.warn("[exchange-rates] API fetch failed, using fallback rates:", error);
    return { ...FALLBACK_RATES };
  }
}

/**
 * Refresh exchange rates in the DB if stale (>24h old).
 */
export async function refreshExchangeRates(): Promise<void> {
  await ensureExchangeRatesTable();

  const staleness = await buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT MAX(fetched_at) as latest FROM exchange_rates`
    );
    return result.rows[0]?.latest;
  }, null);

  const latest = staleness ? new Date(staleness) : null;
  const isStale = !latest || (Date.now() - latest.getTime()) > RATE_STALE_HOURS * 60 * 60 * 1000;

  if (!isStale) return;

  const rates = await fetchRatesFromApi();

  await buildSafeQuery(async () => {
    for (const [pair, rate] of Object.entries(rates)) {
      const [base, target] = pair.split("_");
      await pool.query(
        `INSERT INTO exchange_rates (base_currency, target_currency, rate, source, fetched_at)
         VALUES ($1, $2, $3, 'exchangerate-api', NOW())
         ON CONFLICT (base_currency, target_currency)
         DO UPDATE SET rate = EXCLUDED.rate, source = EXCLUDED.source, fetched_at = EXCLUDED.fetched_at`,
        [base, target, rate]
      );
    }
  }, undefined);
}

// --- Conversion ---

/**
 * Get the exchange rate between two currencies.
 * Uses DB cache if available, otherwise fallback rates.
 */
export async function getExchangeRate(
  base: CurrencyCode,
  target: CurrencyCode
): Promise<number> {
  if (base === target) return 1;

  await ensureExchangeRatesTable();

  const rate = await buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT rate FROM exchange_rates WHERE base_currency = $1 AND target_currency = $2`,
      [base, target]
    );
    return result.rows.length > 0 ? parseFloat(result.rows[0].rate) : null;
  }, null);

  if (rate) return rate;

  // Use fallback
  const fallbackKey = `${base}_${target}`;
  return FALLBACK_RATES[fallbackKey] || 1;
}

/**
 * Convert an amount from one currency to another.
 */
export async function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get all supported currencies.
 */
export function getSupportedCurrencies(): CurrencyCode[] {
  return [...SUPPORTED_CURRENCIES];
}

/**
 * Get currency symbol for display.
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  return symbols[currency] || currency;
}

/**
 * Format a price amount with currency symbol.
 */
export function formatPrice(amount: number, currency: CurrencyCode): string {
  const symbols: Record<CurrencyCode, string> = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${symbol}${formatted}`;
}

/**
 * Get all cached rates for client-side use.
 */
export async function getAllRates(base: CurrencyCode = "EUR"): Promise<Record<string, number>> {
  await refreshExchangeRates();

  const rates: Record<string, number> = {};
  for (const target of SUPPORTED_CURRENCIES) {
    rates[`${base}_${target}`] = await getExchangeRate(base, target);
  }
  return rates;
}
