/**
 * Script to link existing articles to buying guide templates
 * Run with: npx tsx scripts/link-articles-to-templates.ts
 */

import "dotenv/config";
import { pool } from "../lib/db";

async function linkArticlesToTemplates() {
  console.log("Linking articles to buying guide templates...");

  const articleTemplateMap: Record<string, string> = {
    "monohull-vs-catamaran-comparison": "monohull-vs-catamaran-explained",
    "how-to-choose-your-first-sailboat": "how-to-choose-first-sailboat",
    "best-bluewater-cruising-sailboats": "best-bluewater-cruisers",
  };

  for (const [slug, templateId] of Object.entries(articleTemplateMap)) {
    try {
      const result = await pool.query(
        "UPDATE articles SET buying_guide_template_id = $1 WHERE slug = $2 RETURNING title",
        [templateId, slug]
      );

      if (result.rows.length > 0) {
        console.log(
          `✅ Linked "${result.rows[0].title}" to template "${templateId}"`
        );
      } else {
        console.log(`⚠️  Article with slug "${slug}" not found`);
      }
    } catch (error) {
      console.error(
        `❌ Error linking article "${slug}" to template "${templateId}":`,
        error
      );
    }
  }

  console.log("\nDone!");
  await pool.end();
}

linkArticlesToTemplates().catch(console.error);
