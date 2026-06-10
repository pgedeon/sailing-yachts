/**
 * P25.4 — Translation Service
 *
 * Multilingual content pipeline: auto-translate descriptions, articles, and other
 * content to French using template-based generation and translation memory.
 */

import { pool } from "@/lib/db";
import { createHash } from "crypto";

// ─── Types ─────────────────────────────────────────────────────────────

export type ContentType = "yacht_description" | "manufacturer_description" | "article" | "guide" | "glossary_term" | "faq";
export type TranslationStatus = "pending" | "auto_translated" | "in_review" | "approved" | "rejected";
export type TranslationMethod = "manual" | "template" | "memory" | "external";

export interface ContentTranslation {
  id: number;
  contentType: ContentType;
  contentId: number;
  fieldName: string;
  sourceLocale: string;
  targetLocale: string;
  sourceText: string | null;
  translatedText: string;
  translationMethod: TranslationMethod;
  status: TranslationStatus;
  qualityScore: number | null;
  reviewerId: number | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TranslationStats {
  total: number;
  byStatus: Record<TranslationStatus, number>;
  byContentType: Record<string, number>;
  byMethod: Record<string, number>;
  coverageByType: Record<string, { total: number; translated: number; pct: number }>;
}

export interface TranslationQueueItem {
  id: number;
  contentType: ContentType;
  contentId: number;
  fieldName: string;
  sourceText: string | null;
  translatedText: string;
  translationMethod: TranslationMethod;
  status: TranslationStatus;
  qualityScore: number | null;
  createdAt: Date;
}

// ─── Translation Memory ────────────────────────────────────────────────

function hashText(text: string): string {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

/**
 * Look up a translation in translation memory.
 */
export async function lookupTranslationMemory(
  sourceText: string,
  sourceLocale = "en",
  targetLocale = "fr"
): Promise<string | null> {
  const hash = hashText(sourceText);
  const result = await pool.query(
    `SELECT translated_text, match_count FROM translation_memory
     WHERE source_hash = $1 AND source_locale = $2 AND target_locale = $3
     LIMIT 1`,
    [hash, sourceLocale, targetLocale]
  );
  if (result.rows.length > 0) {
    // Increment match count
    await pool.query(
      `UPDATE translation_memory SET match_count = match_count + 1, updated_at = NOW()
       WHERE source_hash = $1 AND source_locale = $2 AND target_locale = $3`,
      [hash, sourceLocale, targetLocale]
    );
    return result.rows[0].translated_text;
  }
  return null;
}

/**
 * Add an entry to translation memory (from approved translations).
 */
export async function addToTranslationMemory(
  sourceText: string,
  translatedText: string,
  category: string | null = null,
  sourceLocale = "en",
  targetLocale = "fr"
): Promise<void> {
  const hash = hashText(sourceText);
  await pool.query(
    `INSERT INTO translation_memory (source_locale, target_locale, source_text, translated_text, source_hash, category)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (source_hash, source_locale, target_locale)
     DO UPDATE SET translated_text = $4, match_count = translation_memory.match_count + 1, updated_at = NOW()`,
    [sourceLocale, targetLocale, sourceText.trim(), translatedText.trim(), hash, category]
  );
}

// ─── French Template Translations ──────────────────────────────────────

/**
 * Template-based French translation for yacht descriptions.
 * Uses pattern matching and vocabulary mapping for common phrases.
 */
const VOCABULARY: Record<string, string> = {
  "sailing yacht": "voilier",
  "sailboat": "voilier",
  "monohull": "monocoque",
  "cruiser": "croiseur",
  "racer": "régatier",
  "cruiser-racer": "croiseur-régatier",
  "bluewater": "hauturière",
  "keel": "quille",
  "fin keel": "quille à bulbe",
  "wing keel": "quille à ailerons",
  "full keel": "quille longue",
  "lifting keel": "quille relevable",
  "hull": "coque",
  "fiberglass": "fibre de verre",
  "carbon fiber": "fibre de carbone",
  "aluminum": "aluminium",
  "steel": "acier",
  "wood": "bois",
  "beam": "maître-bau",
  "draft": "tirant d'eau",
  "displacement": "déplacement",
  "ballast": "ballast",
  "sail area": "surface de voilure",
  "rig": "gréement",
  "sloop": "sloop",
  "cutter": "cutter",
  "ketch": "ketch",
  "yawl": "yawl",
  "cabins": "cabines",
  "berths": "couchettes",
  "heads": "salles d'eau",
  "engine": "moteur",
  "diesel": "diesel",
  "outboard": "hors-bord",
  "fuel capacity": "capacité de carburant",
  "water capacity": "capacité d'eau",
  "overall length": "longueur hors tout",
  "manufacturer": "constructeur",
  "year": "année",
  "designed for": "conçu pour",
  "perfect for": "parfait pour",
  "ideal for": "idéal pour",
  "built for": "construit pour",
  "features": "caractéristiques",
  "offers": "offre",
  "includes": "comprend",
  "measures": "mesure",
  "measuring": "mesurant",
  "equipped with": "équipé de",
  "with a": "avec un",
  "with an": "avec un",
  "performance": "performance",
  "comfort": "confort",
  "safety": "sécurité",
  "value": "rapport qualité-prix",
  "spacious": "spacieux",
  "compact": "compact",
  "lightweight": "léger",
  "robust": "robuste",
  "reliable": "fiable",
  "elegant": "élégant",
  "modern": "moderne",
  "classic": "classique",
  "traditional": "traditionnel",
  "innovative": "innovant",
  "versatile": "polyvalent",
  "family-friendly": "familial",
  "beginner-friendly": "adapté aux débutants",
  "offshore": "au large",
  "coastal": "côtier",
  "ocean": "océanique",
  "racing": "course",
  "cruising": "croisière",
  "day sailing": "balade en mer",
  "weekend": "week-end",
  "long-distance": "longue distance",
  "solo": "en solitaire",
  "couple": "en couple",
  "family": "en famille",
  "group": "en groupe",
  "tons": "tonnes",
  "tonnes": "tonnes",
  "feet": "pieds",
  "meters": "mètres",
  "horsepower": "chevaux",
  "HP": "ch",
};

/**
 * Apply vocabulary-based translation to a text.
 * Uses longest-match-first substitution for accuracy.
 */
export function translateWithVocabulary(text: string): string {
  if (!text) return text;

  // Sort vocabulary by length (longest first) to avoid partial matches
  const sortedEntries = Object.entries(VOCABULARY).sort(
    (a, b) => b[0].length - a[0].length
  );

  let result = text;
  for (const [en, fr] of sortedEntries) {
    // Case-insensitive whole-word matching
    const regex = new RegExp(`\\b${escapeRegex(en)}\\b`, "gi");
    result = result.replace(regex, (match) => {
      // Preserve capitalization pattern
      if (match === match.toUpperCase()) return fr.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return fr.charAt(0).toUpperCase() + fr.slice(1);
      return fr;
    });
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate a French description for a yacht from its specs.
 * Template-based approach — no external API needed.
 */
export function generateFrenchYachtDescription(specs: {
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | string | null;
  beam: number | string | null;
  draft: number | string | null;
  displacement: number | string | null;
  cabins: number | string | null;
  berths: number | string | null;
  keelType: string | null;
  hullMaterial: string | null;
  rigType: string | null;
  engineHp: number | string | null;
}, englishDescription: string | null): string {
  // If we have an English description, translate it
  if (englishDescription) {
    return translateWithVocabulary(englishDescription);
  }

  // Otherwise, generate from specs
  const parts: string[] = [];
  const loa = num(specs.lengthOverall);
  const beamVal = num(specs.beam);
  const draftVal = num(specs.draft);
  const dispVal = num(specs.displacement);
  const cabinsVal = num(specs.cabins);
  const berthsVal = num(specs.berths);
  const hpVal = num(specs.engineHp);

  // Intro
  parts.push(
    `Le ${specs.manufacturer} ${specs.modelName} est un voilier de ${specs.year}.`
  );

  // Dimensions
  if (loa) {
    const ft = (loa * 3.28084).toFixed(1);
    const dimParts: string[] = [`${loa.toFixed(1)}m (${ft}pi) de longueur hors tout`];
    if (beamVal) dimParts.push(`${beamVal.toFixed(1)}m de maître-bau`);
    if (draftVal) dimParts.push(`${draftVal.toFixed(1)}m de tirant d'eau`);
    parts.push(`Il mesure ${dimParts.join(", ")}.`);
  }

  // Displacement
  if (dispVal) {
    parts.push(`Son déplacement est de ${(dispVal / 1000).toFixed(1)} tonnes.`);
  }

  // Keel
  if (specs.keelType) {
    const keelFr = translateWithVocabulary(specs.keelType);
    parts.push(`Équipé d'une ${keelFr}.`);
  }

  // Hull
  if (specs.hullMaterial) {
    const hullFr = translateWithVocabulary(specs.hullMaterial);
    parts.push(`La coque est en ${hullFr}.`);
  }

  // Accommodation
  if (cabinsVal || berthsVal) {
    const accParts: string[] = [];
    if (cabinsVal) accParts.push(`${cabinsVal} cabine${cabinsVal > 1 ? "s" : ""}`);
    if (berthsVal) accParts.push(`${berthsVal} couchette${berthsVal > 1 ? "s" : ""}`);
    parts.push(`Aménagements : ${accParts.join(", ")}.`);
  }

  // Engine
  if (hpVal) {
    parts.push(`Motorisation : ${hpVal} chevaux.`);
  }

  return parts.join(" ");
}

function num(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/**
 * Generate French translation for a manufacturer description.
 */
export function translateManufacturerDescription(
  manufacturerName: string,
  englishDescription: string | null,
  country: string | null,
  foundedYear: number | null
): string {
  if (!englishDescription) {
    const parts: string[] = [`${manufacturerName} est un constructeur de voiliers`];
    if (country) parts.push(`basé en ${translateWithVocabulary(country)}`);
    if (foundedYear) parts.push(`fondé en ${foundedYear}`);
    parts.push(".");
    return parts.join(" ");
  }
  return translateWithVocabulary(englishDescription);
}

/**
 * Translate an article/guide content to French.
 * For articles, use vocabulary-based translation on the prose content.
 */
export function translateArticleContent(
  title: string,
  content: string | null,
  excerpt: string | null
): { titleFr: string; contentFr: string | null; excerptFr: string | null } {
  return {
    titleFr: translateWithVocabulary(title),
    contentFr: content ? translateWithVocabulary(content) : null,
    excerptFr: excerpt ? translateWithVocabulary(excerpt) : null,
  };
}

// ─── Database Operations ───────────────────────────────────────────────

/**
 * Get translation stats.
 */
export async function getTranslationStats(): Promise<TranslationStats> {
  const [statusResult, typeResult, methodResult] = await Promise.all([
    pool.query(`SELECT status, count(*) as cnt FROM content_translations GROUP BY status`),
    pool.query(`SELECT content_type, count(*) as cnt FROM content_translations GROUP BY content_type`),
    pool.query(`SELECT translation_method, count(*) as cnt FROM content_translations GROUP BY translation_method`),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusResult.rows) {
    byStatus[row.status] = Number(row.cnt);
  }

  const byContentType: Record<string, number> = {};
  for (const row of typeResult.rows) {
    byContentType[row.content_type] = Number(row.cnt);
  }

  const byMethod: Record<string, number> = {};
  for (const row of methodResult.rows) {
    byMethod[row.translation_method] = Number(row.cnt);
  }

  // Calculate coverage: how many content items have approved translations
  const coverageByType: Record<string, { total: number; translated: number; pct: number }> = {};

  // Yacht descriptions
  const yachtTotal = await pool.query(`SELECT count(*) as cnt FROM yacht_models WHERE description IS NOT NULL AND length(COALESCE(description, '')) > 10`);
  const yachtTranslated = await pool.query(`SELECT count(DISTINCT content_id) as cnt FROM content_translations WHERE content_type = 'yacht_description' AND status = 'approved'`);
  coverageByType["yacht_description"] = {
    total: Number(yachtTotal.rows[0]?.cnt ?? 0),
    translated: Number(yachtTranslated.rows[0]?.cnt ?? 0),
    pct: yachtTotal.rows[0]?.cnt > 0 ? Math.round((Number(yachtTranslated.rows[0]?.cnt ?? 0) / Number(yachtTotal.rows[0].cnt)) * 100) : 0,
  };

  // Manufacturer descriptions
  const mfgTotal = await pool.query(`SELECT count(*) as cnt FROM manufacturers WHERE description IS NOT NULL AND length(COALESCE(description, '')) > 10`);
  const mfgTranslated = await pool.query(`SELECT count(DISTINCT content_id) as cnt FROM content_translations WHERE content_type = 'manufacturer_description' AND status = 'approved'`);
  coverageByType["manufacturer_description"] = {
    total: Number(mfgTotal.rows[0]?.cnt ?? 0),
    translated: Number(mfgTranslated.rows[0]?.cnt ?? 0),
    pct: mfgTotal.rows[0]?.cnt > 0 ? Math.round((Number(mfgTranslated.rows[0]?.cnt ?? 0) / Number(mfgTotal.rows[0].cnt)) * 100) : 0,
  };

  // Articles
  const articleTotal = await pool.query(`SELECT count(*) as cnt FROM articles WHERE is_published = true`);
  const articleTranslated = await pool.query(`SELECT count(DISTINCT content_id) as cnt FROM content_translations WHERE content_type = 'article' AND status = 'approved'`);
  coverageByType["article"] = {
    total: Number(articleTotal.rows[0]?.cnt ?? 0),
    translated: Number(articleTranslated.rows[0]?.cnt ?? 0),
    pct: articleTotal.rows[0]?.cnt > 0 ? Math.round((Number(articleTranslated.rows[0]?.cnt ?? 0) / Number(articleTotal.rows[0].cnt)) * 100) : 0,
  };

  return {
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    byStatus: byStatus as Record<TranslationStatus, number>,
    byContentType,
    byMethod,
    coverageByType,
  };
}

/**
 * Get the translation queue (pending / auto_translated / in_review items).
 */
export async function getTranslationQueue(
  status?: TranslationStatus,
  contentType?: ContentType,
  limit = 50,
  offset = 0
): Promise<{ items: TranslationQueueItem[]; total: number }> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (status) {
    conditions.push(`status = $${paramIdx++}`);
    params.push(status);
  }
  if (contentType) {
    conditions.push(`content_type = $${paramIdx++}`);
    params.push(contentType);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT count(*) as cnt FROM content_translations ${where}`,
    params
  );

  const result = await pool.query(
    `SELECT id, content_type, content_id, field_name, source_text, translated_text,
            translation_method, status, quality_score, created_at
     FROM content_translations ${where}
     ORDER BY
       CASE status
         WHEN 'pending' THEN 1
         WHEN 'auto_translated' THEN 2
         WHEN 'in_review' THEN 3
         ELSE 4
       END,
       created_at ASC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );

  return {
    items: result.rows.map((row) => ({
      id: Number(row.id),
      contentType: row.content_type,
      contentId: Number(row.content_id),
      fieldName: row.field_name,
      sourceText: row.source_text,
      translatedText: row.translated_text,
      translationMethod: row.translation_method,
      status: row.status,
      qualityScore: row.quality_score ? Number(row.quality_score) : null,
      createdAt: row.created_at,
    })),
    total: Number(countResult.rows[0]?.cnt ?? 0),
  };
}

/**
 * Get a single translation.
 */
export async function getTranslation(id: number): Promise<ContentTranslation | null> {
  const result = await pool.query(
    `SELECT * FROM content_translations WHERE id = $1`,
    [id]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

/**
 * Update translation status (approve/reject).
 */
export async function updateTranslationStatus(
  id: number,
  status: TranslationStatus,
  reviewerId?: number
): Promise<ContentTranslation | null> {
  const result = await pool.query(
    `UPDATE content_translations
     SET status = $1, reviewer_id = $2, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [status, reviewerId ?? null, id]
  );
  if (result.rows.length === 0) return null;

  // If approved, add to translation memory
  const row = result.rows[0];
  if (status === "approved" && row.source_text && row.translated_text) {
    await addToTranslationMemory(
      row.source_text,
      row.translated_text,
      row.content_type,
      row.source_locale,
      row.target_locale
    ).catch(() => { /* non-critical */ });
  }

  return mapRow(row);
}

/**
 * Update the translated text of a translation.
 */
export async function updateTranslationText(
  id: number,
  translatedText: string,
  method?: TranslationMethod
): Promise<ContentTranslation | null> {
  const result = await pool.query(
    `UPDATE content_translations
     SET translated_text = $1, translation_method = COALESCE($2, translation_method), updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [translatedText, method ?? null, id]
  );
  if (result.rows.length === 0) return null;
  return mapRow(result.rows[0]);
}

/**
 * Create or update a translation.
 */
export async function upsertTranslation(params: {
  contentType: ContentType;
  contentId: number;
  fieldName: string;
  sourceLocale?: string;
  targetLocale?: string;
  sourceText?: string;
  translatedText: string;
  translationMethod?: TranslationMethod;
  status?: TranslationStatus;
  qualityScore?: number;
}): Promise<ContentTranslation> {
  const {
    contentType,
    contentId,
    fieldName,
    sourceLocale = "en",
    targetLocale = "fr",
    sourceText,
    translatedText,
    translationMethod = "manual",
    status = "pending",
    qualityScore = 50,
  } = params;

  const result = await pool.query(
    `INSERT INTO content_translations (content_type, content_id, field_name, source_locale, target_locale, source_text, translated_text, translation_method, status, quality_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (content_type, content_id, field_name, source_locale, target_locale)
     DO UPDATE SET translated_text = $7, translation_method = $8, status = $9, quality_score = $10, source_text = $6, updated_at = NOW()
     RETURNING *`,
    [contentType, contentId, fieldName, sourceLocale, targetLocale, sourceText ?? null, translatedText, translationMethod, status, qualityScore]
  );
  return mapRow(result.rows[0]);
}

/**
 * Get an approved translation for a content item.
 */
export async function getApprovedTranslation(
  contentType: ContentType,
  contentId: number,
  fieldName: string,
  targetLocale = "fr"
): Promise<string | null> {
  const result = await pool.query(
    `SELECT translated_text FROM content_translations
     WHERE content_type = $1 AND content_id = $2 AND field_name = $3 AND target_locale = $4 AND status = 'approved'
     LIMIT 1`,
    [contentType, contentId, fieldName, targetLocale]
  );
  return result.rows[0]?.translated_text ?? null;
}

/**
 * Auto-generate French translations for all yachts missing them.
 * Uses template-based generation.
 */
export async function autoGenerateYachtTranslations(): Promise<{
  generated: number;
  skipped: number;
  errors: number;
}> {
  // Find yachts with English descriptions but no French translation
  const result = await pool.query(`
    SELECT y.id, y.model_name, y.slug, y.description, y.length_overall, y.beam, y.draft,
           y.displacement, y.cabins, y.berths, y.keel_type, y.hull_material, y.rig_type,
           y.engine_hp, m.name as manufacturer_name, m.country, m.founded_year
    FROM yacht_models y
    LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
    WHERE y.description IS NOT NULL AND length(COALESCE(y.description, '')) > 10
    AND NOT EXISTS (
      SELECT 1 FROM content_translations ct
      WHERE ct.content_type = 'yacht_description' AND ct.content_id = y.id
      AND ct.field_name = 'description' AND ct.target_locale = 'fr' AND ct.status = 'approved'
    )
    ORDER BY y.id
    LIMIT 200
  `);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of result.rows) {
    try {
      // Check translation memory first
      const memoryMatch = row.description
        ? await lookupTranslationMemory(row.description, "en", "fr")
        : null;

      let translatedText: string;
      let method: TranslationMethod;

      if (memoryMatch) {
        translatedText = memoryMatch;
        method = "memory";
      } else {
        translatedText = generateFrenchYachtDescription(
          {
            manufacturer: row.manufacturer_name,
            modelName: row.model_name,
            year: 0, // we don't have year here, not critical
            lengthOverall: row.length_overall,
            beam: row.beam,
            draft: row.draft,
            displacement: row.displacement,
            cabins: row.cabins,
            berths: row.berths,
            keelType: row.keel_type,
            hullMaterial: row.hull_material,
            rigType: row.rig_type,
            engineHp: row.engine_hp,
          },
          row.description
        );
        method = "template";
      }

      await upsertTranslation({
        contentType: "yacht_description",
        contentId: Number(row.id),
        fieldName: "description",
        sourceText: row.description,
        translatedText,
        translationMethod: method,
        status: "auto_translated",
        qualityScore: method === "memory" ? 85 : 60,
      });
      generated++;
    } catch (err) {
      console.error(`Error generating translation for yacht ${row.id}:`, err);
      errors++;
    }
  }

  return { generated, skipped, errors };
}

/**
 * Auto-generate French translations for all manufacturers missing them.
 */
export async function autoGenerateManufacturerTranslations(): Promise<{
  generated: number;
  skipped: number;
  errors: number;
}> {
  const result = await pool.query(`
    SELECT m.id, m.name, m.description, m.country, m.founded_year
    FROM manufacturers m
    WHERE m.description IS NOT NULL AND length(COALESCE(m.description, '')) > 10
    AND NOT EXISTS (
      SELECT 1 FROM content_translations ct
      WHERE ct.content_type = 'manufacturer_description' AND ct.content_id = m.id
      AND ct.field_name = 'description' AND ct.target_locale = 'fr' AND ct.status = 'approved'
    )
    ORDER BY m.id
  `);

  let generated = 0;
  let errors = 0;

  for (const row of result.rows) {
    try {
      const memoryMatch = row.description
        ? await lookupTranslationMemory(row.description, "en", "fr")
        : null;

      let translatedText: string;
      let method: TranslationMethod;

      if (memoryMatch) {
        translatedText = memoryMatch;
        method = "memory";
      } else {
        translatedText = translateManufacturerDescription(
          row.name,
          row.description,
          row.country,
          row.founded_year
        );
        method = "template";
      }

      await upsertTranslation({
        contentType: "manufacturer_description",
        contentId: Number(row.id),
        fieldName: "description",
        sourceText: row.description,
        translatedText,
        translationMethod: method,
        status: "auto_translated",
        qualityScore: method === "memory" ? 85 : 60,
      });
      generated++;
    } catch (err) {
      console.error(`Error generating translation for manufacturer ${row.id}:`, err);
      errors++;
    }
  }

  return { generated, skipped: 0, errors };
}

/**
 * Auto-generate French translations for published articles.
 */
export async function autoGenerateArticleTranslations(): Promise<{
  generated: number;
  skipped: number;
  errors: number;
}> {
  const result = await pool.query(`
    SELECT a.id, a.title, a.content, a.excerpt
    FROM articles a
    WHERE a.is_published = true
    AND NOT EXISTS (
      SELECT 1 FROM content_translations ct
      WHERE ct.content_type = 'article' AND ct.content_id = a.id
      AND ct.field_name = 'title' AND ct.target_locale = 'fr' AND ct.status = 'approved'
    )
    ORDER BY a.id
    LIMIT 100
  `);

  let generated = 0;
  let errors = 0;

  for (const row of result.rows) {
    try {
      const { titleFr, contentFr, excerptFr } = translateArticleContent(
        row.title,
        row.content,
        row.excerpt
      );

      // Upsert title translation
      await upsertTranslation({
        contentType: "article",
        contentId: Number(row.id),
        fieldName: "title",
        sourceText: row.title,
        translatedText: titleFr,
        translationMethod: "template",
        status: "auto_translated",
        qualityScore: 60,
      });

      // Upsert content translation
      if (contentFr) {
        await upsertTranslation({
          contentType: "article",
          contentId: Number(row.id),
          fieldName: "content",
          sourceText: row.content,
          translatedText: contentFr,
          translationMethod: "template",
          status: "auto_translated",
          qualityScore: 60,
        });
      }

      // Upsert excerpt translation
      if (excerptFr) {
        await upsertTranslation({
          contentType: "article",
          contentId: Number(row.id),
          fieldName: "excerpt",
          sourceText: row.excerpt,
          translatedText: excerptFr,
          translationMethod: "template",
          status: "auto_translated",
          qualityScore: 60,
        });
      }

      generated++;
    } catch (err) {
      console.error(`Error generating translation for article ${row.id}:`, err);
      errors++;
    }
  }

  return { generated, skipped: 0, errors };
}

/**
 * Approve all auto-translated items (bulk approve).
 */
export async function bulkApproveAutoTranslations(
  contentType?: ContentType
): Promise<number> {
  const conditions = ["status = 'auto_translated'"];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (contentType) {
    conditions.push(`content_type = $${paramIdx++}`);
    params.push(contentType);
  }

  const result = await pool.query(
    `UPDATE content_translations
     SET status = 'approved', reviewed_at = NOW(), updated_at = NOW()
     WHERE ${conditions.join(" AND ")}
     RETURNING id, source_text, translated_text, content_type, source_locale, target_locale`,
    params
  );

  // Add all to translation memory
  for (const row of result.rows) {
    if (row.source_text && row.translated_text) {
      await addToTranslationMemory(
        row.source_text,
        row.translated_text,
        row.content_type,
        row.source_locale,
        row.target_locale
      ).catch(() => {});
    }
  }

  return result.rows.length;
}

/**
 * Get translation memory stats.
 */
export async function getTranslationMemoryStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  totalMatchCount: number;
}> {
  const [totalResult, categoryResult, matchResult] = await Promise.all([
    pool.query(`SELECT count(*) as cnt FROM translation_memory`),
    pool.query(`SELECT COALESCE(category, 'uncategorized') as cat, count(*) as cnt FROM translation_memory GROUP BY category`),
    pool.query(`SELECT sum(match_count) as total FROM translation_memory`),
  ]);

  const byCategory: Record<string, number> = {};
  for (const row of categoryResult.rows) {
    byCategory[row.cat] = Number(row.cnt);
  }

  return {
    total: Number(totalResult.rows[0]?.cnt ?? 0),
    byCategory,
    totalMatchCount: Number(matchResult.rows[0]?.total ?? 0),
  };
}

// ─── Helper ────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): ContentTranslation {
  return {
    id: Number(row.id),
    contentType: row.content_type as ContentType,
    contentId: Number(row.content_id),
    fieldName: row.field_name as string,
    sourceLocale: (row.source_locale as string) ?? "en",
    targetLocale: (row.target_locale as string) ?? "fr",
    sourceText: (row.source_text as string) ?? null,
    translatedText: row.translated_text as string,
    translationMethod: (row.translation_method as TranslationMethod) ?? "manual",
    status: (row.status as TranslationStatus) ?? "pending",
    qualityScore: row.quality_score ? Number(row.quality_score) : null,
    reviewerId: row.reviewer_id ? Number(row.reviewer_id) : null,
    reviewedAt: row.reviewed_at as Date | null,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}
