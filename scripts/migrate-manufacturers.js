const { neon } = require('@neondatabase/serverless');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = neon(connectionString);

  try {
    console.log("Starting manufacturers table migration...");

    // Check current structure
    const columns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'manufacturers'
      ORDER BY ordinal_position
    `;
    console.log("Current columns:", columns.map(c => c.column_name));

    // Add description column if not exists
    await sql`
      ALTER TABLE manufacturers
      ADD COLUMN IF NOT EXISTS description TEXT
    `;
    console.log("✓ Added description column");

    // Add logo_url column if not exists
    await sql`
      ALTER TABLE manufacturers
      ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)
    `;
    console.log("✓ Added logo_url column");

    // Rename website to website_url if needed
    const hasWebsite = columns.some(c => c.column_name === 'website');
    const hasWebsiteUrl = columns.some(c => c.column_name === 'website_url');

    if (hasWebsite && !hasWebsiteUrl) {
      await sql`
        ALTER TABLE manufacturers
        RENAME COLUMN website TO website_url
      `;
      console.log("✓ Renamed website → website_url");
    } else if (!hasWebsiteUrl) {
      console.log("⚠ No website column found to rename");
    } else {
      console.log("✓ website_url already exists");
    }

    // Verify new structure
    const newColumns = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'manufacturers'
      ORDER BY ordinal_position
    `;
    console.log("New columns:", newColumns.map(c => c.column_name));

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});