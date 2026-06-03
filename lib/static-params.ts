/**
 * Shared generateStaticParams helpers for pre-building all dynamic pages at build time.
 *
 * This is the single most impactful optimization for Vercel costs:
 * - Without generateStaticParams, each unique URL triggers a serverless function on first visit
 * - With it, all pages are pre-rendered at build time and served from CDN cache
 *
 * Usage in [locale] page files:
 *   import { getYachtParams } from '@/lib/static-params';
 *   export async function generateStaticParams() {
 *     return getYachtParams(); // returns [{ locale: 'en', slug: '...' }, ...]
 *   }
 */

import { db } from "@/lib/db-edge";
import { yachtModels, manufacturers, articles, searchIntents, manufacturerSpotlights } from "@/lib/db-edge";
import { eq, and, sql } from "drizzle-orm";
import { SIZE_CATEGORIES } from "@/lib/size-categories";
import { USE_CASES } from "@/lib/use-case-landing";
import { EDITORIAL_YEARS } from "@/lib/best-year-size-landing";
import { getAllGlossaryTerms } from "@/lib/glossary";
import { locales } from "@/i18n";
import { slugify } from "@/lib/utils/slugify";

type SlugParam = { slug: string };
type ComparisonParam = { slugA: string; slugB: string };

// ─── Internal helpers ─────────────────────────────────────────────

/** Wrap any params array with locale variants */
function withLocales<T extends Record<string, string>>(params: T[]): Array<T & { locale: string }> {
  return locales.flatMap((locale: string) =>
    params.map((p: T) => ({ ...p, locale }))
  );
}

/** Safe query wrapper — returns [] on build errors (e.g. no DATABASE_URL) */
async function safeQuery<T>(fn: () => Promise<T[]>): Promise<T[]> {
  try { return await fn(); } catch { return [] as T[]; }
}

// ─── DB-backed slug fetchers ─────────────────────────────────────

async function fetchYachtSlugs(): Promise<SlugParam[]> {
  const rows = await db
    .select({ slug: yachtModels.slug })
    .from(yachtModels)
    .where(sql`${yachtModels.slug} IS NOT NULL`);
  return rows.map((r: { slug: string | null }) => r.slug).filter(Boolean).map((slug: string) => ({ slug }));
}

async function fetchManufacturerSlugs(): Promise<SlugParam[]> {
  const rows = await db
    .select({ name: manufacturers.name })
    .from(manufacturers);
  return rows
    .filter((r: { name: string | null }) => r.name)
    .map((r: { name: string }) => ({ slug: slugify(r.name) }));
}

async function fetchGuideSlugs(): Promise<SlugParam[]> {
  const rows = await db
    .select({ slug: articles.slug })
    .from(articles)
    .where(and(eq(articles.isPublished, true), sql`${articles.slug} IS NOT NULL`));
  return rows.map((r: { slug: string | null }) => r.slug).filter(Boolean).map((slug: string) => ({ slug }));
}

async function fetchSearchIntentSlugs(): Promise<SlugParam[]> {
  const rows = await db
    .select({ slug: searchIntents.slug })
    .from(searchIntents)
    .where(and(eq(searchIntents.isPublished, true), sql`${searchIntents.slug} IS NOT NULL`));
  return rows.map((r: { slug: string | null }) => r.slug).filter(Boolean).map((slug: string) => ({ slug }));
}

async function fetchSpotlightSlugs(): Promise<SlugParam[]> {
  const rows = await db
    .select({ slug: manufacturerSpotlights.slug })
    .from(manufacturerSpotlights)
    .where(and(eq(manufacturerSpotlights.isPublished, true), sql`${manufacturerSpotlights.slug} IS NOT NULL`));
  return rows.map((r: { slug: string | null }) => r.slug).filter(Boolean).map((slug: string) => ({ slug }));
}

async function fetchComparisonSlugs(limit: number = 30): Promise<ComparisonParam[]> {
  const rows = await db
    .select({ slug: yachtModels.slug })
    .from(yachtModels)
    .where(sql`${yachtModels.slug} IS NOT NULL`)
    .limit(limit);
  const slugs: string[] = rows.map((r: { slug: string | null }) => r.slug).filter(Boolean) as string[];
  const comparisons: ComparisonParam[] = [];
  for (let i = 0; i < Math.min(slugs.length, 25); i++) {
    for (let j = i + 1; j < Math.min(slugs.length, 25); j++) {
      comparisons.push({ slugA: slugs[i], slugB: slugs[j] });
    }
  }
  return comparisons;
}

async function fetchManufacturerComparisonSlugs(): Promise<ComparisonParam[]> {
  const rows = await db
    .select({ name: manufacturers.name })
    .from(manufacturers)
    .limit(20);
  const slugs: string[] = rows
    .filter((r: { name: string | null }) => r.name)
    .map((r: { name: string }) => slugify(r.name));
  const comparisons: ComparisonParam[] = [];
  for (let i = 0; i < Math.min(slugs.length, 15); i++) {
    for (let j = i + 1; j < Math.min(slugs.length, 15); j++) {
      comparisons.push({ slugA: slugs[i], slugB: slugs[j] });
    }
  }
  return comparisons;
}

// ─── Exported generateStaticParams functions ───────────────────────

/** /yachts/[slug] */
export async function getYachtParams() {
  return withLocales(await safeQuery(fetchYachtSlugs));
}

/** /manufacturers/[slug] */
export async function getManufacturerParams() {
  return withLocales(await safeQuery(fetchManufacturerSlugs));
}

/** /guides/[slug] */
export async function getGuideParams() {
  return withLocales(await safeQuery(fetchGuideSlugs));
}

/** /glossary/[slug] */
export function getGlossaryParams() {
  return withLocales(getAllGlossaryTerms().map((t) => ({ slug: t.slug })));
}

/** /search-intent/[slug] */
export async function getSearchIntentParams() {
  return withLocales(await safeQuery(fetchSearchIntentSlugs));
}

/** /manufacturers/[slug]/spotlight */
export async function getSpotlightParams() {
  return withLocales(await safeQuery(fetchSpotlightSlugs));
}

/** /manufacturers/[slug]/partners */
export async function getPartnersParams() {
  return withLocales(await safeQuery(fetchManufacturerSlugs));
}

/** /manufacturers/[slug]/[sizeCategory] */
export async function getManufacturerSizeParams() {
  const mfrs = await safeQuery(fetchManufacturerSlugs);
  return withLocales(
    mfrs.flatMap((m) => SIZE_CATEGORIES.map((c) => ({ slug: m.slug, sizeCategory: c.slug })))
  );
}

/** /yachts/by-size/[sizeCategory] */
export function getSizeCategoryParams() {
  return withLocales(SIZE_CATEGORIES.map((c) => ({ sizeCategory: c.slug })));
}

/** /yachts/for/[useCase] */
export function getUseCaseParams() {
  return withLocales(USE_CASES.map((u) => ({ useCase: u.slug })));
}

/** /yachts/best/[year]/[sizeCategory] */
export function getBestYearSizeParams() {
  return withLocales(
    EDITORIAL_YEARS.flatMap((year) =>
      SIZE_CATEGORIES.map((c) => ({ year: String(year), sizeCategory: c.slug }))
    )
  );
}

/** /compare/[slugA]-vs-[slugB] */
export async function getComparisonParams() {
  return withLocales(await safeQuery(fetchComparisonSlugs));
}

/** /compare-manufacturers/[slugA]-vs-[slugB] */
export async function getManufacturerComparisonParams() {
  return withLocales(await safeQuery(fetchManufacturerComparisonSlugs));
}

/** /best/[slug] */
export function getBestParams() {
  return withLocales(SIZE_CATEGORIES.map((c) => ({ slug: c.slug })));
}

/** /best-value/[slug] */
export function getBestValueParams() {
  return withLocales(SIZE_CATEGORIES.map((c) => ({ slug: c.slug })));
}

/** /cheaper-alternatives-to/[slug] */
export async function getCheaperAlternativeParams() {
  return withLocales(await safeQuery(async (): Promise<SlugParam[]> => {
    const rows = await db
      .select({ slug: yachtModels.slug })
      .from(yachtModels)
      .where(sql`${yachtModels.slug} IS NOT NULL`)
      .limit(30);
    return rows.map((r: { slug: string | null }) => r.slug).filter(Boolean).map((slug: string) => ({ slug }));
  }));
}
