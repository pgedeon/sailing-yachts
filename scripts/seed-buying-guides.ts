/**
 * Seed Buying Guide Articles
 *
 * Creates sample buying guide articles from templates.
 * Run with: npx tsx scripts/seed-buying-guides.ts
 */

import { pool } from "../lib/db";
import { createArticle } from "../lib/articles";
import {
  BUYING_GUIDE_TEMPLATES,
  type BuyingGuideTemplate,
} from "../lib/buying-guides";

async function seedBuyingGuides() {
  try {
    console.log("Seeding buying guide articles...");

    let created = 0;
    let skipped = 0;

    for (const template of BUYING_GUIDE_TEMPLATES) {
      // Check if article already exists
      const existing = await pool.query(
        `SELECT id FROM articles WHERE slug = $1`,
        [template.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⊘ Skipped: ${template.title} (already exists)`);
        skipped++;
        continue;
      }

      // Create article from template
      await createArticle({
        slug: template.id,
        title: template.title,
        excerpt: template.description,
        content: generateMarkdownContent(template),
        contentMarkdown: generateMarkdownContent(template),
        category: "Buying Guide",
        author: "Sailing Yacht Info Team",
        authorTitle: "Editorial Team",
        readingTimeMinutes: Math.ceil(template.faqs.length * 1.5 + 3),
        buyingGuideTemplateId: template.id,
        isPublished: true,
        publishedAt: new Date().toISOString(),
      });

      console.log(`  ✓ Created: ${template.title}`);
      created++;
    }

    console.log(`\n✓ Seed complete: ${created} created, ${skipped} skipped`);
  } catch (error: any) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function generateMarkdownContent(template: BuyingGuideTemplate): string {
  let markdown = template.intro + "\n\n";

  // Add recommendations section
  markdown += "## Recommended Yachts\n\n";
  markdown +=
    "Based on the criteria described above, we've curated a selection of yachts that fit these specifications. Browse the listings below to find boats that match your needs.\n\n";

  // Add FAQ section
  markdown += "## Frequently Asked Questions\n\n";
  for (const faq of template.faqs) {
    markdown += `### ${faq.question}\n\n${faq.answer}\n\n`;
  }

  // Add CTA section
  markdown += "## Next Steps\n\n";
  markdown +=
    "Ready to explore these yachts in detail? Browse our full database to compare specs, read reviews, and find your perfect sailing yacht.\n\n";

  return markdown;
}

seedBuyingGuides();
