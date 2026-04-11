import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";
import { slugify } from "@/lib/utils/slugify";

export interface ManufacturerSpotlightMilestone {
  year: number;
  event: string;
}

export interface ManufacturerSpotlightNotableModelInput {
  yachtSlug: string;
  reason: string;
}

export interface ManufacturerSpotlightYacht {
  id: number;
  slug: string;
  modelName: string;
  year: number;
  manufacturerName: string;
  manufacturerSlug: string;
}

export interface ManufacturerSpotlightNotableModel
  extends ManufacturerSpotlightNotableModelInput {
  yacht: ManufacturerSpotlightYacht | null;
}

export interface ManufacturerSpotlightManufacturer {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  foundedYear: number | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  description: string | null;
}

export interface ManufacturerSpotlightListItem {
  id: number;
  manufacturerId: number;
  slug: string;
  title: string;
  metaDescription: string | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  manufacturer: ManufacturerSpotlightManufacturer;
}

export interface ManufacturerSpotlight extends ManufacturerSpotlightListItem {
  historyMarkdown: string;
  brandPositioning: string | null;
  notableModels: ManufacturerSpotlightNotableModel[];
  milestones: ManufacturerSpotlightMilestone[];
}

export interface CreateManufacturerSpotlightInput {
  manufacturerId: number;
  slug: string;
  title: string;
  metaDescription?: string | null;
  historyMarkdown: string;
  brandPositioning?: string | null;
  notableModels?: ManufacturerSpotlightNotableModelInput[];
  milestones?: ManufacturerSpotlightMilestone[];
  isPublished?: boolean;
  publishedAt?: string | Date | null;
}

export interface UpdateManufacturerSpotlightInput {
  manufacturerId?: number;
  slug?: string;
  title?: string;
  metaDescription?: string | null;
  historyMarkdown?: string;
  brandPositioning?: string | null;
  notableModels?: ManufacturerSpotlightNotableModelInput[];
  milestones?: ManufacturerSpotlightMilestone[];
  isPublished?: boolean;
  publishedAt?: string | Date | null;
}

const SPOTLIGHT_SELECT = `
  SELECT
    s.*,
    m.name AS manufacturer_name,
    m.country AS manufacturer_country,
    m.founded_year AS manufacturer_founded_year,
    m.website_url AS manufacturer_website_url,
    m.logo_url AS manufacturer_logo_url,
    m.description AS manufacturer_description
  FROM manufacturer_spotlights s
  INNER JOIN manufacturers m ON s.manufacturer_id = m.id
`;

function normalizeDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value : new Date(value);
}

function mapManufacturer(row: any): ManufacturerSpotlightManufacturer {
  return {
    id: row.manufacturer_id,
    name: row.manufacturer_name,
    slug: slugify(row.manufacturer_name),
    country: row.manufacturer_country ?? null,
    foundedYear: row.manufacturer_founded_year ?? null,
    websiteUrl: row.manufacturer_website_url ?? null,
    logoUrl: row.manufacturer_logo_url ?? null,
    description: row.manufacturer_description ?? null,
  };
}

function normalizeNotableModels(
  value: unknown,
): ManufacturerSpotlightNotableModelInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as
        | { yachtSlug?: string; yacht_slug?: string; reason?: string }
        | undefined;

      return {
        yachtSlug: record?.yachtSlug || record?.yacht_slug || "",
        reason: record?.reason || "",
      };
    })
    .filter((item) => item.yachtSlug && item.reason);
}

function serializeNotableModels(
  models: ManufacturerSpotlightNotableModelInput[] | undefined,
) {
  return (models || []).map((model) => ({
    yacht_slug: model.yachtSlug,
    reason: model.reason,
  }));
}

function normalizeMilestones(value: unknown): ManufacturerSpotlightMilestone[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      const record = item as { year?: number; event?: string } | undefined;

      return {
        year: Number(record?.year || 0),
        event: record?.event || "",
      };
    })
    .filter((item) => Number.isFinite(item.year) && item.year > 0 && item.event)
    .sort((a, b) => a.year - b.year);
}

async function hydrateNotableModels(
  models: ManufacturerSpotlightNotableModelInput[],
): Promise<ManufacturerSpotlightNotableModel[]> {
  const yachtSlugs = Array.from(
    new Set(models.map((model) => model.yachtSlug).filter(Boolean)),
  );

  if (yachtSlugs.length === 0) {
    return models.map((model) => ({ ...model, yacht: null }));
  }

  const result = await pool.query(
    `
      SELECT
        y.id,
        y.slug,
        y.model_name,
        y.year,
        m.name AS manufacturer_name
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      WHERE y.slug = ANY($1::text[])
    `,
    [yachtSlugs],
  );

  const yachtsBySlug = new Map<string, ManufacturerSpotlightYacht>();

  for (const row of result.rows) {
    if (!row.slug) {
      continue;
    }

    yachtsBySlug.set(row.slug, {
      id: row.id,
      slug: row.slug,
      modelName: row.model_name,
      year: row.year,
      manufacturerName: row.manufacturer_name || "Unknown",
      manufacturerSlug: slugify(row.manufacturer_name || "unknown"),
    });
  }

  return models.map((model) => ({
    ...model,
    yacht: yachtsBySlug.get(model.yachtSlug) || null,
  }));
}

function mapSpotlightListItem(row: any): ManufacturerSpotlightListItem {
  return {
    id: row.id,
    manufacturerId: row.manufacturer_id,
    slug: row.slug,
    title: row.title,
    metaDescription: row.meta_description ?? null,
    isPublished: Boolean(row.is_published),
    publishedAt: normalizeDate(row.published_at),
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
    manufacturer: mapManufacturer(row),
  };
}

async function mapSpotlight(row: any): Promise<ManufacturerSpotlight> {
  const notableModels = await hydrateNotableModels(
    normalizeNotableModels(row.notable_models),
  );

  return {
    ...mapSpotlightListItem(row),
    historyMarkdown: row.history_markdown,
    brandPositioning: row.brand_positioning ?? null,
    notableModels,
    milestones: normalizeMilestones(row.milestones),
  };
}

export async function getSpotlightBySlug(
  slug: string,
): Promise<ManufacturerSpotlight | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `${SPOTLIGHT_SELECT}
       WHERE s.slug = $1 AND s.is_published = true
       LIMIT 1`,
      [slug],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapSpotlight(result.rows[0]);
  }, null);
}

export async function getSpotlightByManufacturerId(
  manufacturerId: number,
): Promise<ManufacturerSpotlight | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `${SPOTLIGHT_SELECT}
       WHERE s.manufacturer_id = $1 AND s.is_published = true
       LIMIT 1`,
      [manufacturerId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return mapSpotlight(result.rows[0]);
  }, null);
}

export async function getAllPublishedSpotlights(): Promise<
  ManufacturerSpotlightListItem[]
> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `${SPOTLIGHT_SELECT}
       WHERE s.is_published = true
       ORDER BY COALESCE(s.published_at, s.updated_at, s.created_at) DESC, m.name ASC`,
    );

    return result.rows.map(mapSpotlightListItem);
  }, []);
}

export async function getAllManufacturerSpotlights(): Promise<
  ManufacturerSpotlightListItem[]
> {
  const result = await pool.query(
    `${SPOTLIGHT_SELECT}
     ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC NULLS LAST, m.name ASC`,
  );

  return result.rows.map(mapSpotlightListItem);
}

export async function getManufacturerSpotlightById(
  id: number,
): Promise<ManufacturerSpotlight | null> {
  const result = await pool.query(
    `${SPOTLIGHT_SELECT}
     WHERE s.id = $1
     LIMIT 1`,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapSpotlight(result.rows[0]);
}

export async function createManufacturerSpotlight(
  data: CreateManufacturerSpotlightInput,
): Promise<ManufacturerSpotlight | null> {
  const isPublished = data.isPublished ?? false;
  const publishedAt = isPublished
    ? normalizeDate(data.publishedAt) || new Date()
    : normalizeDate(data.publishedAt);

  const result = await pool.query(
    `
      INSERT INTO manufacturer_spotlights (
        manufacturer_id,
        slug,
        title,
        meta_description,
        history_markdown,
        brand_positioning,
        notable_models,
        milestones,
        is_published,
        published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
      RETURNING id
    `,
    [
      data.manufacturerId,
      slugify(data.slug),
      data.title,
      data.metaDescription ?? null,
      data.historyMarkdown,
      data.brandPositioning ?? null,
      JSON.stringify(serializeNotableModels(data.notableModels)),
      JSON.stringify(data.milestones || []),
      isPublished,
      publishedAt,
    ],
  );

  const spotlightId = result.rows[0]?.id;
  if (!spotlightId) {
    return null;
  }

  return getManufacturerSpotlightById(spotlightId);
}

export async function updateManufacturerSpotlight(
  id: number,
  data: UpdateManufacturerSpotlightInput,
): Promise<ManufacturerSpotlight | null> {
  const existing = await getManufacturerSpotlightById(id);

  if (!existing) {
    return null;
  }

  const nextIsPublished = data.isPublished ?? existing.isPublished;

  let nextPublishedAt = existing.publishedAt;
  if (data.isPublished === true) {
    nextPublishedAt = normalizeDate(data.publishedAt) || existing.publishedAt || new Date();
  } else if (data.isPublished === false) {
    nextPublishedAt = normalizeDate(data.publishedAt);
  } else if (data.publishedAt !== undefined) {
    nextPublishedAt = normalizeDate(data.publishedAt);
  }

  await pool.query(
    `
      UPDATE manufacturer_spotlights
      SET manufacturer_id = $1,
          slug = $2,
          title = $3,
          meta_description = $4,
          history_markdown = $5,
          brand_positioning = $6,
          notable_models = $7::jsonb,
          milestones = $8::jsonb,
          is_published = $9,
          published_at = $10,
          updated_at = NOW()
      WHERE id = $11
    `,
    [
      data.manufacturerId ?? existing.manufacturerId,
      slugify(data.slug ?? existing.slug),
      data.title ?? existing.title,
      data.metaDescription !== undefined
        ? data.metaDescription
        : existing.metaDescription,
      data.historyMarkdown ?? existing.historyMarkdown,
      data.brandPositioning !== undefined
        ? data.brandPositioning
        : existing.brandPositioning,
      JSON.stringify(
        serializeNotableModels(
          data.notableModels ?? existing.notableModels.map((model) => ({
            yachtSlug: model.yachtSlug,
            reason: model.reason,
          })),
        ),
      ),
      JSON.stringify(data.milestones ?? existing.milestones),
      nextIsPublished,
      nextPublishedAt,
      id,
    ],
  );

  return getManufacturerSpotlightById(id);
}

export async function deleteManufacturerSpotlight(id: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM manufacturer_spotlights WHERE id = $1 RETURNING id`,
    [id],
  );

  return result.rows.length > 0;
}
