const { Pool } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function addTestYacht() {
  const client = await pool.connect();
  try {
    // Get or create manufacturer (Beneteau)
    let manufResult = await client.query('SELECT id FROM manufacturers WHERE name = $1', ['Beneteau']);
    let manufacturerId;
    if (manufResult.rows.length === 0) {
      const insertM = await client.query(
        'INSERT INTO manufacturers (name, country) VALUES ($1, $2) RETURNING id',
        ['Beneteau', 'France']
      );
      manufacturerId = insertM.rows[0].id;
    } else {
      manufacturerId = manufResult.rows[0].id;
    }

    // Insert a new yacht model (note: DB column names are snake_case)
    const result = await client.query(
      `INSERT INTO yacht_models (
        model_name, manufacturer_id, year, length_overall, beam, draft, displacement,
        ballast, sail_area_main, rig_type, keel_type, hull_material,
        cabins, berths, heads, max_occupancy, engine_hp, engine_type,
        fuel_capacity, water_capacity, design_notes, description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        'First 22', manufacturerId, 2025, 6.70, 2.50, 1.45, 1800,
        600, 28.0, 'Sloop', 'Fin keel', 'Fiberglass',
        1, 4, 1, 4, 21, 'Diesel',
        50, 100, 'Performance cruising racer', 'Test yacht added via script'
      ]
    );
    console.log('Inserted yacht:', result.rows[0]);
    console.log('✅ Test yacht added successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

addTestYacht().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
