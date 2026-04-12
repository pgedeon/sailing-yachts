/**
 * FAQ Harvesting Pipeline (P7.6)
 *
 * Mines search queries, compare pairs, and newsletter interactions
 * to propose new FAQ entries and guide topics ranked by frequency and intent.
 */

import { pool } from "@/lib/db";
import { buildSafeQuery } from "@/lib/build-safe";

// --- Types ---

export interface FaqProposal {
  id: number;
  source: "search" | "compare" | "newsletter" | "manual";
  sourceQuery: string | null;
  question: string;
  suggestedAnswer: string | null;
  category: string | null;
  intentType: string | null;
  frequency: number;
  priorityScore: number;
  status: "proposed" | "approved" | "published" | "rejected";
  relatedYachtSlugs: string[] | null;
  relatedArticleSlugs: string[] | null;
  matchedSearchIntentSlug: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
}

export interface HarvestedTopic {
  source: "search" | "compare";
  sourceQuery: string;
  question: string;
  suggestedAnswer: string;
  category: string;
  intentType: string;
  frequency: number;
  relatedYachtSlugs?: string[];
}

export interface ProposalSummary {
  totalProposed: number;
  totalApproved: number;
  totalPublished: number;
  totalRejected: number;
  byCategory: Record<string, number>;
  topProposals: FaqProposal[];
}

// --- Intent Classification ---

const COMPARISON_PATTERNS = [
  /\bvs\b/i,
  /\bcompare\b/i,
  /\bdifference\b/i,
  /\bbetter\b/i,
  /\bversus\b/i,
  /\bor\b.*\bor\b/i,
];

const TRANSACTIONAL_PATTERNS = [
  /\bbuy\b/i,
  /\bcost\b/i,
  /\bprice\b/i,
  /\bcheap\w*\b/i,
  /\bafford\w*\b/i,
  /\bvalue\b/i,
  /\bbest\b/i,
  /\brecommend\w*\b/i,
];

const SPECIFICATION_PATTERNS = [
  /\blength\b/i,
  /\bbeam\b/i,
  /\bdraft\b/i,
  /\bweight\b/i,
  /\bdisplacement\b/i,
  /\bspeed\b/i,
  /\bcabin\w*\b/i,
  /\bhp\b/i,
  /\bengine\b/i,
  /\bkeel\b/i,
  /\brig\b/i,
];

/**
 * Classify the intent type of a search query
 */
export function classifyIntent(query: string): string {
  if (COMPARISON_PATTERNS.some((p) => p.test(query))) {
    return "comparison";
  }
  if (TRANSACTIONAL_PATTERNS.some((p) => p.test(query))) {
    return "transactional";
  }
  if (SPECIFICATION_PATTERNS.some((p) => p.test(query))) {
    return "informational";
  }
  // Check if it's a specific yacht/brand name → navigational
  if (/^[A-Z]/.test(query) && query.split(" ").length <= 4) {
    return "navigational";
  }
  return "informational";
}

/**
 * Classify the content category of a search query
 */
export function classifyCategory(query: string): string {
  const lower = query.toLowerCase();

  if (/\b(?:buy|cost|price|cheap|afford|budget|invest|value)\b/.test(lower))
    return "buying";
  if (
    /\b(?:length|beam|draft|weight|displacement|speed|cabin|engine|hp|keel|rig|hull)\b/.test(
      lower
    )
  )
    return "specs";
  if (
    /\b(?:maintain|maintenance|repair|fix|service|winteriz|antifoul|bottom paint)\b/.test(
      lower
    )
  )
    return "maintenance";
  if (/\b(?:vs|compare|difference|better|versus|which)\b/.test(lower))
    return "comparison";
  if (
    /\b(?:beginner|first|start|learn|newbie|novice)\b/.test(lower)
  )
    return "buying";
  if (
    /\b(?:liveaboard|cruising|bluewater|coastal|offshore|ocean)\b/.test(lower)
  )
    return "general";
  return "general";
}

/**
 * Generate a natural-language FAQ question from a search query
 */
export function generateQuestionFromQuery(
  query: string,
  intentType: string,
  category: string
): string {
  const trimmed = query.trim();

  // Already a question
  if (/^(what|which|how|why|where|when|is|are|can|do|does|should)/i.test(trimmed)) {
    return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
  }

  // Comparison intent
  if (intentType === "comparison") {
    const vsMatch = trimmed.match(/(.+?)\s+(?:vs|versus|or)\s+(.+)/i);
    if (vsMatch) {
      return `What are the differences between ${vsMatch[1].trim()} and ${vsMatch[2].trim()}?`;
    }
    return `How does ${trimmed} compare to alternatives?`;
  }

  // Transactional/buying
  if (category === "buying") {
    return `What should I know about ${trimmed}?`;
  }

  // Specs
  if (category === "specs") {
    return `What are the specifications for ${trimmed}?`;
  }

  // Default
  return `What is ${trimmed}?`;
}

/**
 * Generate a brief suggested answer for a FAQ proposal
 */
export function generateSuggestedAnswer(
  query: string,
  intentType: string,
  category: string,
  yachtSlugs?: string[]
): string {
  const lower = query.toLowerCase();

  if (intentType === "comparison") {
    const yachtCount = yachtSlugs?.length ?? 0;
    if (yachtCount >= 2) {
      return `Use our comparison tool to see detailed spec differences between these yachts side by side, including dimensions, displacement, sail area, and cabin layout.`;
    }
    return `Compare specifications, pricing, and owner reviews to find the right choice for your sailing needs.`;
  }

  if (category === "buying") {
    return `Consider your primary use case (coastal cruising, bluewater, racing), budget, experience level, and preferred size range when making this decision.`;
  }

  if (category === "specs") {
    return `Check our detailed yacht database for exact specifications including LOA, beam, draft, displacement, and sail area.`;
  }

  if (category === "maintenance") {
    return `Regular maintenance is essential for safety and longevity. Consult manufacturer guidelines and consider professional survey annually.`;
  }

  return `Browse our complete yacht database and guides for detailed information.`;
}

/**
 * Calculate priority score (0-100) for a FAQ proposal
 * Higher frequency + comparison/transactional intent + no existing coverage = higher score
 */
export function calculatePriorityScore(params: {
  frequency: number;
  intentType: string;
  hasExistingArticle: boolean;
  hasMatchingIntent: boolean;
  category: string;
}): number {
  let score = 0;

  // Frequency component (0-30): logarithmic scale
  if (params.frequency > 0) {
    score += Math.min(30, Math.log2(params.frequency + 1) * 5);
  }

  // Intent component (0-25): comparison and transactional are more valuable
  switch (params.intentType) {
    case "comparison":
      score += 25;
      break;
    case "transactional":
      score += 20;
      break;
    case "informational":
      score += 15;
      break;
    case "navigational":
      score += 5;
      break;
  }

  // Category component (0-15): buying and comparison topics more valuable
  switch (params.category) {
    case "buying":
      score += 15;
      break;
    case "comparison":
      score += 13;
      break;
    case "specs":
      score += 10;
      break;
    case "maintenance":
      score += 8;
      break;
    default:
      score += 5;
  }

  // No existing coverage bonus (0-20)
  if (!params.hasExistingArticle) {
    score += 20;
  } else {
    score += 5; // Still some value if existing article is thin
  }

  // Has matching search intent (0-10): shows validated search demand
  if (params.hasMatchingIntent) {
    score += 10;
  }

  return Math.min(100, Math.round(score * 100) / 100);
}

// --- Database Operations ---

/**
 * Run the harvesting pipeline: mine search intents and compare data to generate proposals
 */
export async function runHarvestingPipeline(): Promise<{
  newProposals: number;
  updatedProposals: number;
  skipped: number;
}> {
  let newProposals = 0;
  let updatedProposals = 0;
  let skipped = 0;

  // 1. Mine search intents
  const searchIntents = await pool.query(
    `SELECT slug, title, search_query, search_count, category, intro
     FROM search_intents
     WHERE search_count > 0
     ORDER BY search_count DESC
     LIMIT 100`
  );

  for (const intent of searchIntents.rows) {
    const query = intent.search_query || intent.title;
    if (!query) continue;

    const intentType = classifyIntent(query);
    const category = classifyCategory(query) || intent.category || "general";
    const question = generateQuestionFromQuery(query, intentType, category);
    const suggestedAnswer = generateSuggestedAnswer(query, intentType, category);

    // Check if proposal already exists for this query
    const existing = await pool.query(
      `SELECT id, frequency FROM faq_proposals WHERE source_query = $1 AND source = 'search'`,
      [query]
    );

    if (existing.rows.length > 0) {
      // Update frequency
      await pool.query(
        `UPDATE faq_proposals
         SET frequency = $1, updated_at = NOW()
         WHERE id = $2`,
        [intent.search_count, existing.rows[0].id]
      );
      updatedProposals++;
    } else {
      // Check for existing articles on similar topics
      const existingArticles = await pool.query(
        `SELECT slug FROM articles WHERE is_published = true AND (title ILIKE $1 OR content ILIKE $1)`,
        [`%${query.substring(0, 50)}%`]
      );

      const priorityScore = calculatePriorityScore({
        frequency: intent.search_count,
        intentType,
        hasExistingArticle: existingArticles.rows.length > 0,
        hasMatchingIntent: true,
        category,
      });

      // Only create proposals with meaningful scores
      if (priorityScore >= 15) {
        await pool.query(
          `INSERT INTO faq_proposals
           (source, source_query, question, suggested_answer, category, intent_type, frequency, priority_score, matched_search_intent_slug, related_article_slugs, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'proposed')`,
          [
            "search",
            query,
            question,
            suggestedAnswer,
            category,
            intentType,
            intent.search_count,
            priorityScore,
            intent.slug,
            existingArticles.rows.length > 0
              ? JSON.stringify(existingArticles.rows.map((r: any) => r.slug))
              : null,
          ]
        );
        newProposals++;
      } else {
        skipped++;
      }
    }
  }

  // 2. Mine compare usage data
  const comparePairs = await pool.query(
    `SELECT yacht_slug_a, yacht_slug_b, compare_count
     FROM compare_usage
     WHERE compare_count > 0
     ORDER BY compare_count DESC
     LIMIT 50`
  );

  for (const pair of comparePairs.rows) {
    const query = `${pair.yacht_slug_a} vs ${pair.yacht_slug_b}`;
    const question = `What are the differences between ${pair.yacht_slug_a.replace(/-/g, " ")} and ${pair.yacht_slug_b.replace(/-/g, " ")}?`;

    const existing = await pool.query(
      `SELECT id, frequency FROM faq_proposals WHERE source_query = $1 AND source = 'compare'`,
      [query]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE faq_proposals SET frequency = $1, updated_at = NOW() WHERE id = $2`,
        [pair.compare_count, existing.rows[0].id]
      );
      updatedProposals++;
    } else {
      const priorityScore = calculatePriorityScore({
        frequency: pair.compare_count,
        intentType: "comparison",
        hasExistingArticle: false,
        hasMatchingIntent: false,
        category: "comparison",
      });

      if (priorityScore >= 15) {
        await pool.query(
          `INSERT INTO faq_proposals
           (source, source_query, question, suggested_answer, category, intent_type, frequency, priority_score, related_yacht_slugs, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'proposed')`,
          [
            "compare",
            query,
            question,
            `Compare these yachts side by side using our comparison tool for detailed specifications, performance data, and owner reviews.`,
            "comparison",
            "comparison",
            pair.compare_count,
            priorityScore,
            JSON.stringify([pair.yacht_slug_a, pair.yacht_slug_b]),
          ]
        );
        newProposals++;
      } else {
        skipped++;
      }
    }
  }

  // 3. Recalculate priority scores for all proposed items
  await pool.query(`
    UPDATE faq_proposals p
    SET priority_score = LEAST(100,
      CASE
        WHEN p.source = 'compare' THEN
          LEAST(30, LN(p.frequency + 1) * 5) + 25 + 13 +
          CASE WHEN NOT EXISTS (SELECT 1 FROM articles a WHERE a.is_published AND a.title ILIKE '%' || p.source_query || '%') THEN 20 ELSE 5 END
        ELSE
          LEAST(30, LN(p.frequency + 1) * 5) +
          CASE p.intent_type WHEN 'comparison' THEN 25 WHEN 'transactional' THEN 20 WHEN 'informational' THEN 15 ELSE 5 END +
          CASE p.category WHEN 'buying' THEN 15 WHEN 'comparison' THEN 13 WHEN 'specs' THEN 10 WHEN 'maintenance' THEN 8 ELSE 5 END +
          CASE WHEN p.matched_search_intent_slug IS NOT NULL THEN 10 ELSE 0 END +
          CASE WHEN p.related_article_slugs IS NULL OR p.related_article_slugs = 'null' THEN 20 ELSE 5 END
      END
    ),
    updated_at = NOW()
    WHERE status = 'proposed'
  `);

  return { newProposals, updatedProposals, skipped };
}

/**
 * Get all FAQ proposals with optional filtering
 */
export async function getFaqProposals(filters?: {
  status?: string;
  category?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<{ proposals: FaqProposal[]; total: number }> {
  return buildSafeQuery(async () => {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (filters?.status) {
      conditions.push(`status = $${paramIdx}`);
      values.push(filters.status);
      paramIdx++;
    }
    if (filters?.category) {
      conditions.push(`category = $${paramIdx}`);
      values.push(filters.category);
      paramIdx++;
    }
    if (filters?.source) {
      conditions.push(`source = $${paramIdx}`);
      values.push(filters.source);
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM faq_proposals ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0]?.total || "0", 10);

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const result = await pool.query(
      `SELECT * FROM faq_proposals ${whereClause}
       ORDER BY priority_score DESC, frequency DESC
       LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...values, limit, offset]
    );

    const proposals: FaqProposal[] = result.rows.map(mapRowToProposal);

    return { proposals, total };
  }, { proposals: [], total: 0 });
}

/**
 * Get a single FAQ proposal by ID
 */
export async function getFaqProposalById(
  id: number
): Promise<FaqProposal | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `SELECT * FROM faq_proposals WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return mapRowToProposal(result.rows[0]);
  }, null);
}

/**
 * Update a FAQ proposal status (approve/reject/publish)
 */
export async function updateFaqProposalStatus(
  id: number,
  status: "approved" | "rejected" | "published",
  adminNotes?: string
): Promise<FaqProposal | null> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `UPDATE faq_proposals
       SET status = $1, admin_notes = COALESCE($2, admin_notes), reviewed_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, adminNotes || null, id]
    );
    if (result.rows.length === 0) return null;
    return mapRowToProposal(result.rows[0]);
  }, null);
}

/**
 * Create a manual FAQ proposal
 */
export async function createFaqProposal(data: {
  question: string;
  suggestedAnswer?: string;
  category?: string;
  source?: string;
}): Promise<FaqProposal | null> {
  return buildSafeQuery(async () => {
    const intentType = classifyIntent(data.question);
    const category = data.category || classifyCategory(data.question);

    const priorityScore = calculatePriorityScore({
      frequency: 1,
      intentType,
      hasExistingArticle: false,
      hasMatchingIntent: false,
      category,
    });

    const result = await pool.query(
      `INSERT INTO faq_proposals
       (source, source_query, question, suggested_answer, category, intent_type, frequency, priority_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, 'proposed')
       RETURNING *`,
      [
        data.source || "manual",
        data.question,
        data.question,
        data.suggestedAnswer || null,
        category,
        intentType,
        priorityScore,
      ]
    );
    if (result.rows.length === 0) return null;
    return mapRowToProposal(result.rows[0]);
  }, null);
}

/**
 * Record a compare event for tracking popular pairs
 */
export async function recordCompareUsage(
  slugA: string,
  slugB: string
): Promise<void> {
  try {
    // Normalize: always store alphabetically
    const [a, b] = [slugA, slugB].sort();

    await pool.query(
      `INSERT INTO compare_usage (yacht_slug_a, yacht_slug_b, compare_count, last_compared_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (yacht_slug_a, yacht_slug_b)
       DO UPDATE SET
         compare_count = compare_usage.compare_count + 1,
         last_compared_at = NOW()`,
      [a, b]
    );
  } catch (error) {
    console.error("Error recording compare usage:", error);
  }
}

/**
 * Get a summary of FAQ proposals
 */
export async function getFaqProposalSummary(): Promise<ProposalSummary> {
  return buildSafeQuery(async () => {
    const statusCounts = await pool.query(
      `SELECT status, COUNT(*) as count FROM faq_proposals GROUP BY status`
    );

    const categoryCounts = await pool.query(
      `SELECT category, COUNT(*) as count FROM faq_proposals WHERE status = 'proposed' GROUP BY category`
    );

    const topProposals = await pool.query(
      `SELECT * FROM faq_proposals WHERE status = 'proposed' ORDER BY priority_score DESC LIMIT 10`
    );

    const byStatus: Record<string, number> = {};
    for (const row of statusCounts.rows) {
      byStatus[row.status] = parseInt(row.count, 10);
    }

    const byCategory: Record<string, number> = {};
    for (const row of categoryCounts.rows) {
      byCategory[row.category || "general"] = parseInt(row.count, 10);
    }

    return {
      totalProposed: byStatus["proposed"] || 0,
      totalApproved: byStatus["approved"] || 0,
      totalPublished: byStatus["published"] || 0,
      totalRejected: byStatus["rejected"] || 0,
      byCategory,
      topProposals: topProposals.rows.map(mapRowToProposal),
    };
  }, {
    totalProposed: 0,
    totalApproved: 0,
    totalPublished: 0,
    totalRejected: 0,
    byCategory: {},
    topProposals: [],
  });
}

/**
 * Delete a FAQ proposal
 */
export async function deleteFaqProposal(id: number): Promise<boolean> {
  return buildSafeQuery(async () => {
    const result = await pool.query(
      `DELETE FROM faq_proposals WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }, false);
}

// --- Helper ---

function mapRowToProposal(row: any): FaqProposal {
  return {
    id: row.id,
    source: row.source,
    sourceQuery: row.source_query,
    question: row.question,
    suggestedAnswer: row.suggested_answer,
    category: row.category,
    intentType: row.intent_type,
    frequency: row.frequency,
    priorityScore: parseFloat(row.priority_score),
    status: row.status,
    relatedYachtSlugs: row.related_yacht_slugs,
    relatedArticleSlugs: row.related_article_slugs,
    matchedSearchIntentSlug: row.matched_search_intent_slug,
    adminNotes: row.admin_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
  };
}
