/**
 * P20.1 — Description Generation Service
 *
 * Server-side service for batch-generating yacht descriptions from spec data.
 * Stores results in the database with review status for admin approval.
 */

import { db } from "./db";
import { yachtModels, manufacturers } from "../drizzle/schema";
import { eq, or, sql as drizzleSql } from "drizzle-orm";
import {
  generateDescription,
  scoreDescription,
  type YachtSpecsForDescription,
} from "./description-templates";

export interface DescriptionCandidate {
  yachtId: number;
  modelName: string;
  slug: string | null;
  manufacturerName: string;
  currentDescription: string | null;
  generatedDescription: string;
  descriptionScore: number;
}

export interface GenerationResult {
  totalCandidates: number;
  generated: number;
  skipped: number;
  errors: number;
  candidates: DescriptionCandidate[];
}

export interface DescriptionStats {
  total: number;
  withDescription: number;
  missing: number;
  generated: number;
  pending: number;
  approved: number;
  rejected: number;
  manual: number;
}

/**
 * Get description coverage stats.
 */
export async function getDescriptionStats(): Promise<DescriptionStats> {
  const total = await db.select({ count: drizzleSql<number>`count(*)` }).from(yachtModels);
  const withDesc = await db
    .select({ count: drizzleSql<number>`count(*)` })
    .from(yachtModels)
    .where(drizzleSql`description IS NOT NULL AND length(description) > 50`);
  const missing = await db
    .select({ count: drizzleSql<number>`count(*)` })
    .from(yachtModels)
    .where(drizzleSql`description IS NULL OR length(COALESCE(description, '')) <= 50`);

  const pending = await db
    .select({ count: drizzleSql<number>`count(*)` })
    .from(yachtModels)
    .where(drizzleSql`COALESCE(description_status, 'approved') = 'pending'`);

  const generated = await db
    .select({ count: drizzleSql<number>`count(*)` })
    .from(yachtModels)
    .where(drizzleSql`COALESCE(description_source, 'manual') = 'generated'`);

  const rejected = await db
    .select({ count: drizzleSql<number>`count(*)` })
    .from(yachtModels)
    .where(drizzleSql`COALESCE(description_status, 'approved') = 'rejected'`);

  return {
    total: Number(total[0].count),
    withDescription: Number(withDesc[0].count),
    missing: Number(missing[0].count),
    generated: Number(generated[0].count),
    pending: Number(pending[0].count),
    approved: Number(total[0].count) - Number(missing[0].count),
    rejected: Number(rejected[0].count),
    manual: Number(withDesc[0].count) - Number(generated[0].count),
  };
}

/**
 * Find yachts that need descriptions and generate them.
 */
export async function findAndGenerateDescriptions(
  limit: number = 50,
  dryRun: boolean = true
): Promise<GenerationResult> {
  // Find yachts missing descriptions
  const candidates = await db
    .select()
    .from(yachtModels)
    .where(drizzleSql`description IS NULL OR length(COALESCE(description, '')) <= 50`)
    .limit(limit);

  // Get all manufacturer IDs
  const manufacturerIds = [...new Set(candidates.map((c: any) => c.manufacturerId))];

  let manufacturerRows: any[] = [];
  if (manufacturerIds.length > 0) {
    manufacturerRows = await db
      .select({ id: manufacturers.id, name: manufacturers.name })
      .from(manufacturers)
      .where(drizzleSql`${manufacturers.id} = ANY(ARRAY[${drizzleSql.join(manufacturerIds.map((id: unknown) => drizzleSql`${Number(id)}`), drizzleSql`, `)}])`);
  }

  const manufacturerMap = new Map(
    manufacturerRows.map((m: any) => [m.id, m.name])
  );

  const results: DescriptionCandidate[] = [];
  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const yacht of candidates) {
    const y = yacht as any;
    const manufacturerName = manufacturerMap.get(y.manufacturerId) || "Unknown";

    const specs: YachtSpecsForDescription = {
      manufacturer: manufacturerName,
      modelName: y.modelName,
      year: y.year,
      lengthOverall: y.lengthOverall,
      beam: y.beam,
      draft: y.draft,
      displacement: y.displacement,
      ballast: y.ballast,
      sailAreaMain: y.sailAreaMain,
      rigType: y.rigType,
      keelType: y.keelType,
      hullMaterial: y.hullMaterial,
      cabins: y.cabins,
      berths: y.berths,
      heads: y.heads,
      maxOccupancy: y.maxOccupancy,
      engineHp: y.engineHp,
      engineType: y.engineType,
      fuelCapacity: y.fuelCapacity,
      waterCapacity: y.waterCapacity,
      designNotes: y.designNotes,
    };

    try {
      const generatedDesc = generateDescription(specs, "balanced");

      if (!generatedDesc || generatedDesc.trim().length < 50) {
        skipped++;
        continue;
      }

      const candidate: DescriptionCandidate = {
        yachtId: y.id,
        modelName: y.modelName,
        slug: y.slug,
        manufacturerName,
        currentDescription: y.description,
        generatedDescription: generatedDesc,
        descriptionScore: scoreDescription(generatedDesc),
      };

      if (!dryRun) {
        await db
          .update(yachtModels)
          .set({
            description: generatedDesc,
            descriptionSource: "generated",
            descriptionStatus: "pending",
            descriptionGeneratedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(yachtModels.id, y.id));
      }

      results.push(candidate);
      generated++;
    } catch (err) {
      console.error(`Error generating description for yacht ${y.id}:`, err);
      errors++;
    }
  }

  return {
    totalCandidates: candidates.length,
    generated,
    skipped,
    errors,
    candidates: results,
  };
}

/**
 * Get pending descriptions for admin review.
 */
export async function getPendingDescriptions(limit: number = 50, offset: number = 0) {
  return db
    .select({
      id: yachtModels.id,
      modelName: yachtModels.modelName,
      slug: yachtModels.slug,
      description: yachtModels.description,
      descriptionSource: yachtModels.descriptionSource,
      descriptionStatus: yachtModels.descriptionStatus,
      descriptionGeneratedAt: yachtModels.descriptionGeneratedAt,
      manufacturerName: manufacturers.name,
    })
    .from(yachtModels)
    .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
    .where(eq(yachtModels.descriptionStatus, "pending"))
    .orderBy(yachtModels.descriptionGeneratedAt)
    .limit(limit)
    .offset(offset);
}

/**
 * Approve a generated description.
 */
export async function approveDescription(yachtId: number, editedDescription?: string) {
  const updates: Record<string, unknown> = {
    descriptionStatus: "approved",
    updatedAt: new Date(),
  };
  if (editedDescription) {
    updates.description = editedDescription;
  }
  return db
    .update(yachtModels)
    .set(updates)
    .where(eq(yachtModels.id, yachtId));
}

/**
 * Reject a generated description.
 */
export async function rejectDescription(yachtId: number) {
  return db
    .update(yachtModels)
    .set({
      descriptionStatus: "rejected",
      updatedAt: new Date(),
    })
    .where(eq(yachtModels.id, yachtId));
}

/**
 * Batch approve all pending descriptions.
 */
export async function approveAllPending() {
  return db
    .update(yachtModels)
    .set({
      descriptionStatus: "approved",
      updatedAt: new Date(),
    })
    .where(eq(yachtModels.descriptionStatus, "pending"));
}
