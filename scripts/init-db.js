const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Manufacturers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT,
        founded_year INT,
        website_url TEXT,
        logo_url TEXT,
        description TEXT
      );
    `);

    // Yachts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS yachts (
        id SERIAL PRIMARY KEY,
        model_name TEXT NOT NULL,
        manufacturer_id INT REFERENCES manufacturers(id) ON DELETE SET NULL,
        year INT,
        length_overall NUMERIC,
        beam NUMERIC,
        draft NUMERIC,
        displacement NUMERIC,
        ballast NUMERIC,
        main_sail_area NUMERIC,
        rig_type TEXT,
        keel_type TEXT,
        hull_material TEXT,
        cabins INT,
        berths INT,
        heads INT,
        max_occupancy INT,
        engine_hp NUMERIC,
        engine_type TEXT,
        fuel_capacity NUMERIC,
        water_capacity NUMERIC,
        design_notes TEXT,
        description TEXT
      );
    `);

    // Spec categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS spec_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        unit TEXT,
        description TEXT,
        grouping TEXT,
        filterable BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Database schema created/verified');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating schema:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
