import { asc, count, desc, eq, inArray } from "drizzle-orm";

import { db, images, manufacturers, yachtModels } from "@/lib/db";
import { slugify } from "@/lib/utils/slugify";

export interface ManufacturerSummary {
  id: number;
  name: string;
  slug: string;
  country: string | null;
  foundedYear: number | null;
  description: string | null;
  descriptionFr: string | null;
  yachtCount: number;
}

export interface ManufacturerDetail extends ManufacturerSummary {
  websiteUrl: string | null;
  logoUrl: string | null;
}

export interface ManufacturerYachtCard {
  id: number;
  slug: string | null;
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  rigType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  primaryImage: string | null;
}

function parseNullableNumber(value: string | number | null): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getManufacturersWithCounts(): Promise<ManufacturerSummary[]> {
  const rows = await db
    .select({
      id: manufacturers.id,
      name: manufacturers.name,
      country: manufacturers.country,
      foundedYear: manufacturers.foundedYear,
      description: manufacturers.description,
      descriptionFr: manufacturers.descriptionFr,
      yachtCount: count(yachtModels.id),
    })
    .from(manufacturers)
    .leftJoin(yachtModels, eq(yachtModels.manufacturerId, manufacturers.id))
    .groupBy(
      manufacturers.id,
      manufacturers.name,
      manufacturers.country,
      manufacturers.foundedYear,
      manufacturers.description,
      manufacturers.descriptionFr,
    )
    .orderBy(asc(manufacturers.name));

  type ManufacturerCountRow = (typeof rows)[number];

  return rows.map((row: ManufacturerCountRow) => ({
    id: row.id,
    name: row.name,
    slug: slugify(row.name),
    country: row.country,
    foundedYear: row.foundedYear,
    description: row.description,
    descriptionFr: row.descriptionFr,
    yachtCount: Number(row.yachtCount ?? 0),
  }));
}

export async function getManufacturerBySlug(
  slug: string,
): Promise<ManufacturerDetail | null> {
  const rows = await db.select().from(manufacturers).orderBy(asc(manufacturers.name));
  type ManufacturerRow = (typeof rows)[number];
  const manufacturer = rows.find(
    (row: ManufacturerRow) => row.name && slugify(row.name) === slug,
  );

  if (!manufacturer) {
    return null;
  }

  const yachtCountResult = await db
    .select({ yachtCount: count(yachtModels.id) })
    .from(yachtModels)
    .where(eq(yachtModels.manufacturerId, manufacturer.id));

  return {
    id: manufacturer.id,
    name: manufacturer.name,
    slug,
    country: manufacturer.country,
    foundedYear: manufacturer.foundedYear,
    description: manufacturer.description,
    descriptionFr: manufacturer.descriptionFr,
    yachtCount: Number(yachtCountResult[0]?.yachtCount ?? 0),
    websiteUrl: manufacturer.websiteUrl,
    logoUrl: manufacturer.logoUrl,
  };
}

export async function getYachtsByManufacturerId(
  manufacturerId: number,
): Promise<ManufacturerYachtCard[]> {
  const yachtRows = await db
    .select({
      yacht: yachtModels,
      manufacturer: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.manufacturerId, manufacturerId))
    .orderBy(desc(yachtModels.createdAt), asc(yachtModels.modelName));

  type YachtRow = (typeof yachtRows)[number];

  const yachtIds = yachtRows.map((row: YachtRow) => row.yacht.id);

  const imageRows = yachtIds.length
    ? await db
        .select({
          yachtModelId: images.yachtModelId,
          url: images.url,
          isPrimary: images.isPrimary,
          sortOrder: images.sortOrder,
        })
        .from(images)
        .where(inArray(images.yachtModelId, yachtIds))
        .orderBy(asc(images.yachtModelId), desc(images.isPrimary), asc(images.sortOrder))
    : [];

  const primaryImageByYachtId = new Map<number, string>();

  for (const image of imageRows) {
    if (!primaryImageByYachtId.has(image.yachtModelId)) {
      primaryImageByYachtId.set(image.yachtModelId, image.url);
    }
  }

  return yachtRows.map((row: YachtRow) => ({
    id: row.yacht.id,
    slug: row.yacht.slug,
    manufacturer: row.manufacturer || "Unknown",
    modelName: row.yacht.modelName,
    year: row.yacht.year,
    lengthOverall: parseNullableNumber(row.yacht.lengthOverall),
    beam: parseNullableNumber(row.yacht.beam),
    draft: parseNullableNumber(row.yacht.draft),
    displacement: parseNullableNumber(row.yacht.displacement),
    rigType: row.yacht.rigType,
    hullMaterial: row.yacht.hullMaterial,
    cabins: row.yacht.cabins,
    berths: row.yacht.berths,
    primaryImage: primaryImageByYachtId.get(row.yacht.id) || null,
  }));
}
