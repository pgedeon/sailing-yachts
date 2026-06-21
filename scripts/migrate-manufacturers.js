const { Pool } = require('pg');

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
      ? { rejectUnauthorized: false }
      : undefined,
  });
  const client = await pool.connect();

  try {
    console.log("Starting manufacturers table migration...");

    // Check current structure
    const columns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'manufacturers'
      ORDER BY ordinal_position
    `);
    console.log("Current columns:", columns.rows.map(c => c.column_name));

    // Add description column if not exists
    await client.query(`
      ALTER TABLE manufacturers
      ADD COLUMN IF NOT EXISTS description TEXT
    `);
    console.log("✓ Added description column");

    // Add logo_url column if not exists
    await client.query(`
      ALTER TABLE manufacturers
      ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500)
    `);
    console.log("✓ Added logo_url column");

    // Rename website to website_url if needed
    const hasWebsite = columns.rows.some(c => c.column_name === 'website');
    const hasWebsiteUrl = columns.rows.some(c => c.column_name === 'website_url');

    if (hasWebsite && !hasWebsiteUrl) {
      await client.query(`
        ALTER TABLE manufacturers
        RENAME COLUMN website TO website_url
      `);
      console.log("✓ Renamed website → website_url");
    } else if (!hasWebsiteUrl) {
      console.log("⚠ No website column found to rename");
    } else {
      console.log("✓ website_url already exists");
    }

    // Verify new structure
    const newColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'manufacturers'
      ORDER BY ordinal_position
    `);
    console.log("New columns:", newColumns.rows.map(c => c.column_name));

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
