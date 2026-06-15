import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { validate, quizAnswersSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface QuizAnswers {
  experience: string;
  sailingType: string;
  crewSize: string;
  budget: string;
  preferredLength: string;
  keelPreference: string;
  priority: string;
}

interface MatchedYacht {
  id: number;
  slug: string;
  modelName: string;
  manufacturerName: string;
  year: number | null;
  lengthOverall: number | null;
  cabins: number | null;
  keelType: string | null;
  hullMaterial: string | null;
  matchScore: number;
  matchReasons: string[];
  primaryImageUrl: string | null;
}

/**
 * Build SQL WHERE conditions and compute match score per yacht
 * based on quiz answers.
 */
function buildQuizFilters(answers: QuizAnswers): {
  conditions: string[];
  scoreWeights: Array<{ column: string; check: string; weight: number; reason: string }>;
} {
  const conditions: string[] = [];
  const scoreWeights: Array<{ column: string; check: string; weight: number; reason: string }> = [];

  // ─── Preferred Length ─────────────────────────────────────────────
  if (answers.preferredLength === "small") {
    conditions.push("y.length_overall::numeric <= 10");
    scoreWeights.push({
      column: "y.length_overall",
      check: "<= 9",
      weight: 30,
      reason: "Compact size",
    });
  } else if (answers.preferredLength === "medium") {
    conditions.push("y.length_overall::numeric >= 9 AND y.length_overall::numeric <= 14");
    scoreWeights.push({
      column: "y.length_overall",
      check: "BETWEEN 10 AND 13",
      weight: 30,
      reason: "Ideal mid-size",
    });
  } else if (answers.preferredLength === "large") {
    conditions.push("y.length_overall::numeric >= 12");
    scoreWeights.push({
      column: "y.length_overall",
      check: ">= 14",
      weight: 30,
      reason: "Spacious cruiser",
    });
  }
  // "any" → no filter

  // ─── Crew Size → Cabins ──────────────────────────────────────────
  if (answers.crewSize === "solo") {
    scoreWeights.push({
      column: "y.cabins",
      check: "<= 2",
      weight: 20,
      reason: "Perfect for solo sailing",
    });
  } else if (answers.crewSize === "couple") {
    scoreWeights.push({
      column: "y.cabins",
      check: ">= 1 AND y.cabins <= 3",
      weight: 20,
      reason: "Great for couples",
    });
  } else if (answers.crewSize === "family") {
    conditions.push("(y.cabins >= 2 OR y.cabins IS NULL)");
    scoreWeights.push({
      column: "y.cabins",
      check: ">= 3",
      weight: 25,
      reason: "Family-friendly",
    });
  } else if (answers.crewSize === "group") {
    conditions.push("(y.cabins >= 3 OR y.cabins IS NULL)");
    scoreWeights.push({
      column: "y.cabins",
      check: ">= 4",
      weight: 25,
      reason: "Group-ready",
    });
  }

  // ─── Sailing Type ────────────────────────────────────────────────
  if (answers.sailingType === "racing") {
    scoreWeights.push({
      column: "y.rig_type",
      check: "= 'Sloop'",
      weight: 20,
      reason: "Performance rig",
    });
  } else if (answers.sailingType === "offshore") {
    scoreWeights.push({
      column: "y.displacement",
      check: ">= 5000",
      weight: 20,
      reason: "Offshore-capable",
    });
  } else if (answers.sailingType === "cruising") {
    scoreWeights.push({
      column: "y.cabins",
      check: ">= 2",
      weight: 15,
      reason: "Comfortable cruiser",
    });
  }
  // coastal → no extra filter

  // ─── Experience Level ────────────────────────────────────────────
  if (answers.experience === "beginner") {
    // Prefer smaller, easier-to-handle boats
    scoreWeights.push({
      column: "y.length_overall",
      check: "<= 11",
      weight: 15,
      reason: "Beginner-friendly size",
    });
    scoreWeights.push({
      column: "y.keel_type",
      check: "LIKE '%wing%'",
      weight: 10,
      reason: "Stable keel design",
    });
  } else if (answers.experience === "advanced") {
    scoreWeights.push({
      column: "y.length_overall",
      check: ">= 12",
      weight: 10,
      reason: "Advanced handling",
    });
  }

  // ─── Keel Preference ─────────────────────────────────────────────
  if (answers.keelPreference === "fin") {
    conditions.push("(y.keel_type ILIKE '%fin%' OR y.keel_type IS NULL)");
    scoreWeights.push({
      column: "y.keel_type",
      check: "ILIKE '%fin%'",
      weight: 15,
      reason: "Fin keel",
    });
  } else if (answers.keelPreference === "wing") {
    conditions.push("(y.keel_type ILIKE '%wing%' OR y.keel_type IS NULL)");
    scoreWeights.push({
      column: "y.keel_type",
      check: "ILIKE '%wing%'",
      weight: 15,
      reason: "Wing keel",
    });
  } else if (answers.keelPreference === "full") {
    conditions.push("(y.keel_type ILIKE '%full%' OR y.keel_type IS NULL)");
    scoreWeights.push({
      column: "y.keel_type",
      check: "ILIKE '%full%'",
      weight: 15,
      reason: "Full keel",
    });
  }

  return { conditions, scoreWeights };
}

/**
 * Score a yacht row based on how well it matches quiz criteria.
 * Returns 0–100 score and matching reasons.
 */
function scoreYacht(
  row: Record<string, unknown>,
  scoreWeights: Array<{ column: string; check: string; weight: number; reason: string }>,
  answers: QuizAnswers
): { score: number; reasons: string[] } {
  let score = 50; // base score
  const reasons: string[] = [];
  const loa = row.length_overall != null ? Number(row.length_overall) : null;
  const cabins = row.cabins != null ? Number(row.cabins) : null;
  const keelType = row.keel_type as string | null;
  const displacement = row.displacement != null ? Number(row.displacement) : null;
  const rigType = row.rig_type as string | null;

  // Length scoring
  if (answers.preferredLength === "small" && loa != null && loa <= 10) {
    score += 25;
    reasons.push("Compact size");
  } else if (answers.preferredLength === "medium" && loa != null && loa >= 9 && loa <= 14) {
    score += 25;
    reasons.push("Ideal mid-size");
  } else if (answers.preferredLength === "large" && loa != null && loa >= 12) {
    score += 25;
    reasons.push("Spacious cruiser");
  }

  // Crew/cabins scoring
  if (answers.crewSize === "solo" && cabins != null && cabins <= 2) {
    score += 15;
    reasons.push("Solo-friendly");
  } else if (answers.crewSize === "couple" && cabins != null && cabins >= 1 && cabins <= 3) {
    score += 15;
    reasons.push("Couple-friendly");
  } else if (answers.crewSize === "family" && cabins != null && cabins >= 2) {
    score += 20;
    reasons.push("Family-friendly");
  } else if (answers.crewSize === "group" && cabins != null && cabins >= 3) {
    score += 20;
    reasons.push("Group-ready");
  }

  // Sailing type scoring
  if (answers.sailingType === "racing" && rigType === "Sloop") {
    score += 15;
    reasons.push("Performance rig");
  } else if (answers.sailingType === "offshore" && displacement != null && displacement >= 5000) {
    score += 15;
    reasons.push("Offshore-capable");
  } else if (answers.sailingType === "cruising" && cabins != null && cabins >= 2) {
    score += 10;
    reasons.push("Comfortable cruiser");
  } else if (answers.sailingType === "coastal") {
    score += 5;
    reasons.push("Coastal ready");
  }

  // Experience level
  if (answers.experience === "beginner" && loa != null && loa <= 11) {
    score += 10;
    reasons.push("Beginner-friendly");
  } else if (answers.experience === "advanced" && loa != null && loa >= 12) {
    score += 8;
    reasons.push("Advanced handling");
  }

  // Keel preference
  if (answers.keelPreference === "fin" && keelType && keelType.toLowerCase().includes("fin")) {
    score += 12;
    reasons.push("Fin keel");
  } else if (answers.keelPreference === "wing" && keelType && keelType.toLowerCase().includes("wing")) {
    score += 12;
    reasons.push("Wing keel");
  } else if (answers.keelPreference === "full" && keelType && keelType.toLowerCase().includes("full")) {
    score += 12;
    reasons.push("Full keel");
  }

  // Priority boost
  if (answers.priority === "performance" && rigType === "Sloop") {
    score += 5;
    reasons.push("Performance-focused");
  } else if (answers.priority === "comfort" && cabins != null && cabins >= 2) {
    score += 5;
    reasons.push("Comfort-focused");
  } else if (answers.priority === "safety" && displacement != null && displacement >= 4000) {
    score += 5;
    reasons.push("Safety-focused build");
  }

  // Cap at 100
  return { score: Math.min(100, score), reasons: reasons.slice(0, 5) };
}

/** POST /api/quiz — submit quiz answers, get matched yachts */
export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const validation = validate(quizAnswersSchema, rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 },
      );
    }

    const answers: QuizAnswers = {
      experience: validation.data.experience || "",
      sailingType: validation.data.sailingType || "",
      crewSize: validation.data.crewSize || "",
      budget: validation.data.budget || "",
      preferredLength: validation.data.preferredLength || "",
      keelPreference: validation.data.keelPreference || "",
      priority: validation.data.priority || "",
    };

    const { conditions } = buildQuizFilters(answers);

    // Build WHERE clause
    const whereClause =
      conditions.length > 0
        ? "WHERE " + conditions.join(" AND ")
        : "";

    // Fetch candidate yachts
    const query = `
      SELECT y.id, y.model_name, y.slug, y.year, y.length_overall,
             y.cabins, y.keel_type, y.hull_material, y.displacement,
             y.rig_type, y.berths,
             m.name as manufacturer_name,
             (SELECT url FROM images WHERE yacht_model_id = y.id AND is_primary = true LIMIT 1) as primary_image_url
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ${whereClause}
      ORDER BY y.length_overall ASC
      LIMIT 50
    `;

    const result = await pool.query(query);

    // Score each yacht
    const scored: MatchedYacht[] = result.rows
      .map((row) => {
        const { score, reasons } = scoreYacht(row, [], answers);
        return {
          id: Number(row.id),
          slug: row.slug || "",
          modelName: row.model_name || "",
          manufacturerName: row.manufacturer_name || "",
          year: row.year ? Number(row.year) : null,
          lengthOverall: row.length_overall ? Number(row.length_overall) : null,
          cabins: row.cabins ? Number(row.cabins) : null,
          keelType: row.keel_type || null,
          hullMaterial: row.hull_material || null,
          matchScore: score,
          matchReasons: reasons,
          primaryImageUrl: row.primary_image_url || null,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return NextResponse.json({ yachts: scored, total: scored.length });
  } catch (error) {
    console.error("Quiz API error:", error);
    return NextResponse.json(
      { error: "Failed to process quiz" },
      { status: 500 }
    );
  }
}

/** GET /api/quiz — load results from shareable URL parameter */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const encoded = searchParams.get("r");
    if (!encoded) {
      return NextResponse.json(
        { error: "Missing result parameter 'r'" },
        { status: 400 }
      );
    }

    const answers: QuizAnswers = JSON.parse(atob(encoded));
    // Re-run the same logic as POST
    const { conditions } = buildQuizFilters(answers);

    const whereClause =
      conditions.length > 0
        ? "WHERE " + conditions.join(" AND ")
        : "";

    const query = `
      SELECT y.id, y.model_name, y.slug, y.year, y.length_overall,
             y.cabins, y.keel_type, y.hull_material, y.displacement,
             y.rig_type, y.berths,
             m.name as manufacturer_name,
             (SELECT url FROM images WHERE yacht_model_id = y.id AND is_primary = true LIMIT 1) as primary_image_url
      FROM yacht_models y
      LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
      ${whereClause}
      ORDER BY y.length_overall ASC
      LIMIT 50
    `;

    const result = await pool.query(query);

    const scored: MatchedYacht[] = result.rows
      .map((row) => {
        const { score, reasons } = scoreYacht(row, [], answers);
        return {
          id: Number(row.id),
          slug: row.slug || "",
          modelName: row.model_name || "",
          manufacturerName: row.manufacturer_name || "",
          year: row.year ? Number(row.year) : null,
          lengthOverall: row.length_overall ? Number(row.length_overall) : null,
          cabins: row.cabins ? Number(row.cabins) : null,
          keelType: row.keel_type || null,
          hullMaterial: row.hull_material || null,
          matchScore: score,
          matchReasons: reasons,
          primaryImageUrl: row.primary_image_url || null,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return NextResponse.json({ yachts: scored, total: scored.length, answers });
  } catch (error) {
    console.error("Quiz GET error:", error);
    return NextResponse.json(
      { error: "Failed to load quiz results" },
      { status: 500 }
    );
  }
}
