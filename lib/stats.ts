export async function getSiteStats() {
  const { pool } = await import("./db");
  
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM manufacturers WHERE is_visible = true) as manufacturer_count,
      (SELECT COUNT(*) FROM yacht_models WHERE is_visible = true) as yacht_model_count,
      (SELECT COUNT(*) FROM yachts WHERE is_visible = true) as yacht_instance_count,
      (SELECT COUNT(*) FROM reviews WHERE status = 'approved' AND is_visible = true) as approved_review_count,
      (SELECT COUNT(*) FROM yacht_images WHERE is_primary = true AND is_visible = true) as primary_image_count,
      (SELECT COUNT(*) FROM yacht_prices WHERE is_active = true) as active_price_count,
      (SELECT COUNT(DISTINCT yacht_model_id) FROM yacht_prices WHERE is_active = true) as priced_yacht_count,
      (SELECT MAX(created_at) FROM yachts WHERE is_visible = true) as latest_yacht_date,
      (SELECT COUNT(*) FROM manufacturers WHERE is_visible = true AND spotlight_url IS NOT NULL) as spotlight_count
  `);

  const counts = stats.rows[0];
  
  // Ensure all counts are numbers
  return {
    manufacturerCount: parseInt(counts.manufacturer_count || "0", 10),
    yachtModelCount: parseInt(counts.yacht_model_count || "0", 10),
    yachtInstanceCount: parseInt(counts.yacht_instance_count || "0", 10),
    approvedReviewCount: parseInt(counts.approved_review_count || "0", 10),
    primaryImageCount: parseInt(counts.primary_image_count || "0", 10),
    activePriceCount: parseInt(counts.active_price_count || "0", 10),
    pricedYachtCount: parseInt(counts.priced_yacht_count || "0", 10),
    latestYachtDate: counts.latest_yacht_date,
    spotlightCount: parseInt(counts.spotlight_count || "0", 10),
  };
}

export async function getSearchIntentStats() {
  const { pool } = await import("./db");
  
  // Get top search intents (based on page views, could be enhanced later)
  const searchIntents = await pool.query(`
    SELECT 
      search_intent,
      COUNT(*) as page_views,
      MAX(created_at) as last_viewed
    FROM search_page_views
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY search_intent
    ORDER BY page_views DESC
    LIMIT 10
  `);

  return searchIntents.rows;
}

export async function getRecentlyAdded(limit = 10) {
  const { pool } = await import("./db");
  
  const recentlyAdded = await pool.query(`
    SELECT ym.id, ym.model_name, m.name as manufacturer_name, ym.created_at
    FROM yacht_models ym
    LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
    WHERE ym.is_visible = true
    ORDER BY ym.created_at DESC
    LIMIT $1
  `, [limit]);

  return recentlyAdded.rows;
}

export function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+`;
  }
  return `${count}+`;
}

export function getShortTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffDays = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}