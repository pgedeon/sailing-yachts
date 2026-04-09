/**
 * Search Intents Data Service
 *
 * Manages search intent pages for recurring user queries.
 * Supports intent discovery, creation, and yacht matching.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";

export interface SearchIntent {
  id: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  intro: string;
  icon: string;
  filters: {
    lengthMin?: number;
    lengthMax?: number;
    cabinsMin?: number;
    cabinsMax?: number;
    keelType?: string;
    rigType?: string;
    hullMaterial?: string;
    displacementMin?: number;
    displacementMax?: number;
  } | null;
  maxResults: number;
  category: string | null;
  isPublished: boolean;
  searchQuery: string | null;
  searchCount: number;
  lastSearchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchIntentYacht {
  id: number;
  modelName: string;
  slug: string;
  year: number;
  manufacturer: string;
  manufacturerSlug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  hullMaterial: string | null;
  rigType: string | null;
  primaryImageUrl: string | null;
}

export interface SearchIntentData {
  intent: SearchIntent;
  yachts: SearchIntentYacht[];
  totalCount: number;
}

const FALLBACK_DATA: SearchIntentData = {
  intent: {
    id: 0,
    slug: "",
    title: "Not Found",
    metaDescription: null,
    intro: "",
    icon: "🔍",
    filters: null,
    maxResults: 12,
    category: null,
    isPublished: false,
    searchQuery: null,
    searchCount: 0,
    lastSearchedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  yachts: [],
  totalCount: 0,
};

/**
 * Get a search intent by slug (published only)
 */
export async function getSearchIntentBySlug(
  slug: string
): Promise<SearchIntentData> {
  return buildSafeQuery(async () => {
    // Fetch intent
    const intentResult = await pool.query(
      `SELECT * FROM search_intents WHERE slug = $1 AND is_published = true`,
      [slug]
    );

    if (intentResult.rows.length === 0) {
      return FALLBACK_DATA;
    }

    const intent = intentResult.rows[0];
    const filters = intent.filters as any;

    // Build query for matching yachts - use proper type casting
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters?.lengthMin != null) {
      conditions.push(`length_overall >= $${paramIdx}::numeric`);
      values.push(filters.lengthMin);
      paramIdx++;
    }
    if (filters?.lengthMax != null) {
      conditions.push(`length_overall <= $${paramIdx}::numeric`);
      values.push(filters.lengthMax);
      paramIdx++;
    }
    if (filters?.cabinsMin != null) {
      conditions.push(`cabins >= $${paramIdx}::integer`);
      values.push(filters.cabinsMin);
      paramIdx++;
    }
    if (filters?.cabinsMax != null) {
      conditions.push(`cabins <= $${paramIdx}::integer`);
      values.push(filters.cabinsMax);
      paramIdx++;
    }
    if (filters?.keelType) {
      conditions.push(`keel_type = $${paramIdx}`);
      values.push(filters.keelType);
      paramIdx++;
    }
    if (filters?.rigType) {
      conditions.push(`rig_type = $${paramIdx}`);
      values.push(filters.rigType);
      paramIdx++;
    }
    if (filters?.hullMaterial) {
      conditions.push(`hull_material = $${paramIdx}`);
      values.push(filters.hullMaterial);
      paramIdx++;
    }
    if (filters?.displacementMin != null) {
      conditions.push(`displacement >= $${paramIdx}::numeric`);
      values.push(filters.displacementMin);
      paramIdx++;
    }
    if (filters?.displacementMax != null) {
      conditions.push(`displacement <= $${paramIdx}::numeric`);
      values.push(filters.displacementMax);
      paramIdx++;
    }

    // Only include yachts with a slug (publicly visible)
    conditions.push(`slug IS NOT NULL`);
    conditions.push(`length_overall IS NOT NULL`);

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Count query
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM yacht_models ${whereClause}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0]?.total || "0", 10);

    // Data query with limit
    const limit = Math.min(intent.max_results || 12, 24);
    const result = await pool.query(
      `SELECT
        y.id,
        y.model_name,
        y.slug,
        y.year,
        y.length_overall,
        y.beam,
        y.draft,
        y.displacement,
        y.cabins,
        y.berths,
        y.hull_material,
        y.rig_type,
        m.name as manufacturer,
        LOWER(REPLACE(m.name, ' ', '-')) as manufacturer_slug,
        (SELECT img.url FROM images img WHERE img.yacht_model_id = y.id AND img.is_primary = true LIMIT 1) as primary_image_url
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ${whereClause}
      ORDER BY y.length_overall ASC
      LIMIT $${paramIdx}`,
      [...values, limit]
    );

    const yachts: SearchIntentYacht[] = result.rows.map((row: any) => ({
      id: row.id,
      modelName: row.model_name,
      slug: row.slug,
      year: row.year,
      manufacturer: row.manufacturer || "Unknown",
      manufacturerSlug: row.manufacturer_slug,
      lengthOverall: row.length_overall ? parseFloat(row.length_overall) : null,
      beam: row.beam ? parseFloat(row.beam) : null,
      draft: row.draft ? parseFloat(row.draft) : null,
      displacement: row.displacement ? parseFloat(row.displacement) : null,
      cabins: row.cabins,
      berths: row.berths,
      hullMaterial: row.hull_material,
      rigType: row.rig_type,
      primaryImageUrl: row.primary_image_url,
    }));

    return {
      intent: {
        id: intent.id,
        slug: intent.slug,
        title: intent.title,
        metaDescription: intent.meta_description,
        intro: intent.intro,
        icon: intent.icon || "🔍",
        filters: intent.filters,
        maxResults: intent.max_results || 12,
        category: intent.category,
        isPublished: intent.is_published,
        searchQuery: intent.search_query,
        searchCount: intent.search_count || 0,
        lastSearchedAt: intent.last_searched_at,
        createdAt: intent.created_at,
        updatedAt: intent.updated_at,
      },
      yachts,
      totalCount,
    };
  }, FALLBACK_DATA);
}

/**
 * Get all published search intent slugs (for generateStaticParams)
 */
export async function getAllSearchIntentSlugs(): Promise<string[]> {
  try {
    const result = await pool.query(
      `SELECT slug FROM search_intents WHERE is_published = true ORDER BY slug`
    );
    return result.rows.map((row) => row.slug);
  } catch (error) {
    console.error("Error fetching search intent slugs:", error);
    return [];
  }
}

/**
 * Get all search intents (admin view)
 */
export async function getAllSearchIntents(): Promise<SearchIntent[]> {
  try {
    const result = await pool.query(
      `SELECT * FROM search_intents ORDER BY search_count DESC, created_at DESC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      metaDescription: row.meta_description,
      intro: row.intro,
      icon: row.icon || "🔍",
      filters: row.filters,
      maxResults: row.max_results || 12,
      category: row.category,
      isPublished: row.is_published,
      searchQuery: row.search_query,
      searchCount: row.search_count || 0,
      lastSearchedAt: row.last_searched_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching search intents:", error);
    return [];
  }
}

/**
 * Create a new search intent
 */
export async function createSearchIntent(
  data: Omit<SearchIntent, "id" | "searchCount" | "lastSearchedAt" | "createdAt" | "updatedAt">
): Promise<SearchIntent | null> {
  try {
    const result = await pool.query(
      `INSERT INTO search_intents
       (slug, title, meta_description, intro, icon, filters, max_results, category, is_published, search_query)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.slug,
        data.title,
        data.metaDescription,
        data.intro,
        data.icon,
        JSON.stringify(data.filters),
        data.maxResults,
        data.category,
        data.isPublished,
        data.searchQuery,
      ]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      metaDescription: row.meta_description,
      intro: row.intro,
      icon: row.icon || "🔍",
      filters: row.filters,
      maxResults: row.max_results || 12,
      category: row.category,
      isPublished: row.is_published,
      searchQuery: row.search_query,
      searchCount: 0,
      lastSearchedAt: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("Error creating search intent:", error);
    return null;
  }
}

/**
 * Record a search for an intent (for mining/discovery)
 */
export async function recordSearchIntent(
  searchQuery: string,
  matchedIntentSlug?: string
): Promise<void> {
  try {
    if (matchedIntentSlug) {
      // Increment search count for matched intent
      await pool.query(
        `UPDATE search_intents
         SET search_count = COALESCE(search_count, 0) + 1,
             last_searched_at = NOW(),
             updated_at = NOW()
         WHERE slug = $1`,
        [matchedIntentSlug]
      );
    } else {
      // Check if an unpublished intent exists for this query
      const existing = await pool.query(
        `SELECT slug FROM search_intents WHERE search_query = $1`,
        [searchQuery]
      );

      if (existing.rows.length === 0) {
        // Create a draft intent for future review
        const slug = searchQuery
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .substring(0, 100);

        await pool.query(
          `INSERT INTO search_intents (slug, title, intro, search_query, is_published)
           VALUES ($1, $2, $3, $4, false)`,
          [
            slug,
            `Search: ${searchQuery}`,
            `Auto-generated intent from search query: "${searchQuery}"`,
            searchQuery,
          ]
        );
      } else {
        // Increment search count for existing draft
        await pool.query(
          `UPDATE search_intents
           SET search_count = COALESCE(search_count, 0) + 1,
               last_searched_at = NOW(),
               updated_at = NOW()
           WHERE slug = $1`,
          [existing.rows[0].slug]
        );
      }
    }
  } catch (error) {
    console.error("Error recording search intent:", error);
  }
}
