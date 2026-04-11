import { pool } from "@/lib/db";
async function main() {
  const r = await pool.query("SELECT id,slug,title,is_published,manufacturer_id FROM manufacturer_spotlights");
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
