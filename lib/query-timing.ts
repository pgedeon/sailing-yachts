/**
 * Query performance instrumentation for P11.2 query/index audit.
 * Provides timing wrappers around hot database queries to verify index effectiveness.
 */

import { pool } from "@/lib/db";

export interface QueryTimingResult {
  query: string;
  durationMs: number;
  rows: number;
  planSummary: string;
}

/**
 * Run EXPLAIN ANALYZE on a query and return timing + plan info.
 * Safe for production — runs in read-only mode, no data mutation.
 */
export async function explainAnalyze(
  sql: string,
  params: unknown[] = [],
): Promise<QueryTimingResult> {
  const explainSql = `EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`;
  const start = performance.now();
  const result = await pool.query(explainSql, params);
  const durationMs = performance.now() - start;

  const plan = result.rows[0]?.["QUERY PLAN"]?.[0] || {};
  const planSummary = summarizePlan(plan.Plan);

  return {
    query: sql.substring(0, 200),
    durationMs: Math.round(durationMs * 100) / 100,
    rows: plan.Plan?.["Actual Rows"] ?? 0,
    planSummary,
  };
}

interface PlanNode {
  Node_Type?: string;
  Actual_Total_Time?: number;
  Actual_Rows?: number;
  Index_Name?: string;
  Scan_Type?: string;
  Relation_Name?: string;
  "Actual Rows"?: number;
  "Actual Total Time"?: number;
  "Index Name"?: string;
  "Node Type"?: string;
  Plans?: PlanNode[];
}

function summarizePlan(plan: PlanNode | undefined): string {
  if (!plan) return "No plan available";
  const nodeType = plan["Node Type"] || plan.Node_Type || "Unknown";
  const indexName = plan["Index Name"] || plan.Index_Name;
  const relationName = plan.Relation_Name || plan.Relation_Name || '';
  const time = plan["Actual Total Time"] || plan.Actual_Total_Time || 0;

  let summary = `${nodeType}`;
  if (indexName) summary += ` using ${indexName}`;
  if (relationName) summary += ` on ${relationName}`;
  summary += ` (${time.toFixed(2)}ms)`;

  if (plan.Plans?.length) {
    for (const sub of plan.Plans) {
      summary += `\n  → ${summarizePlan(sub)}`;
    }
  }

  return summary;
}

/**
 * Run a full benchmark suite of hot queries and return timing results.
 */
export async function benchmarkHotQueries(): Promise<QueryTimingResult[]> {
  const benchmarks: QueryTimingResult[] = [];

  // Q1: Listing count
  benchmarks.push(
    await explainAnalyze("SELECT COUNT(*) as count FROM yacht_models y"),
  );

  // Q2: Listing page with join
  benchmarks.push(
    await explainAnalyze(
      `SELECT y.*, m.name as manufacturer_name
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       ORDER BY y.id LIMIT 20 OFFSET 0`,
    ),
  );

  // Q3: Detail by slug
  benchmarks.push(
    await explainAnalyze(
      `SELECT y.*, m.name as manufacturer_name
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE y.slug = $1 LIMIT 1`,
      ["beneteau-first-36"],
    ),
  );

  // Q4: Filter by manufacturer + length range
  benchmarks.push(
    await explainAnalyze(
      `SELECT y.*, m.name as manufacturer_name
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE y.manufacturer_id IN ($1, $2, $3)
         AND y.length_overall >= $4 AND y.length_overall <= $5
       ORDER BY y.id LIMIT 20`,
      [1, 2, 3, "30", "45"],
    ),
  );

  // Q5: Search ILIKE (the hot path)
  benchmarks.push(
    await explainAnalyze(
      `SELECT y.id, y.model_name, y.slug, y.length_overall, y.year, m.name AS manufacturer_name
       FROM yacht_models y
       LEFT JOIN manufacturers m ON y.manufacturer_id = m.id
       WHERE (y.model_name ILIKE $1 OR m.name ILIKE $1 OR CONCAT(m.name, ' ', y.model_name) ILIKE $1)
       ORDER BY CASE WHEN y.model_name ILIKE $2 THEN 0 WHEN m.name ILIKE $2 THEN 1 ELSE 2 END,
       y.length_overall DESC NULLS LAST LIMIT 10`,
      ["%oceanis%", "oceanis%"],
    ),
  );

  // Q6: Spec values for yacht
  benchmarks.push(
    await explainAnalyze(
      `SELECT sv.*, sc.name AS category_name, sc.category_group, sc.unit
       FROM spec_values sv
       JOIN spec_categories sc ON sv.spec_category_id = sc.id
       WHERE sv.yacht_model_id = $1
       ORDER BY sc.category_group, sc.name`,
      [1],
    ),
  );

  // Q7: Manufacturer yacht counts
  benchmarks.push(
    await explainAnalyze(
      `SELECT m.id, m.name, COUNT(y.id) as yacht_count
       FROM manufacturers m
       LEFT JOIN yacht_models y ON y.manufacturer_id = m.id
       GROUP BY m.id, m.name ORDER BY m.name`,
    ),
  );

  // Q8: Images for yacht (ordered)
  benchmarks.push(
    await explainAnalyze(
      "SELECT * FROM images WHERE yacht_model_id = $1 ORDER BY sort_order",
      [1],
    ),
  );

  return benchmarks;
}
