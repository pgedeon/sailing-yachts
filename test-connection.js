const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.connect()
  .then(client => {
    console.log('✅ Connected to Neon PostgreSQL');
    return client.query('SELECT version()');
  })
  .then(res => {
    console.log('DB Version:', res.rows[0].version);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  })
  .finally(() => pool.end());