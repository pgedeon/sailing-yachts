import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const updates: Record<string, string> = {};
// We'll read the content from separate files to keep this manageable

async function main() {
  // Article 1: how-to-choose-your-first-sailboat
  const fs = await import("fs");
  const path = await import("path");
  
  const articlesDir = "/tmp/guides-content";
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith(".md"));
  
  for (const file of files) {
    const slug = file.replace(".md", "");
    const content = fs.readFileSync(path.join(articlesDir, file), "utf-8");
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.max(5, Math.ceil(wordCount / 200));
    
    const result = await pool.query(
      `UPDATE articles SET content_markdown = $1, content = $1, reading_time_minutes = $2, updated_at = NOW() WHERE slug = $3 RETURNING id, slug, reading_time_minutes`,
      [content, readingTime, slug]
    );
    
    if (result.rows.length > 0) {
      console.log(`✓ Updated: ${slug} (${wordCount} words, ${readingTime} min read)`);
    } else {
      console.log(`✗ Not found: ${slug}`);
    }
  }
  
  await pool.end();
}

main().catch(console.error);
