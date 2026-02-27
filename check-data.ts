import { db, yachtModels, manufacturers as mfgTable, specCategories } from './lib/db';
import { eq } from 'drizzle-orm';

async function checkData() {
  console.log('=== Checking Yachts ===');
  const yachts = await db.select().from(yachtModels);
  for (const y of yachts) {
    console.log(`ID ${y.id}: ${y.modelName} (manufacturerId: ${y.manufacturerId})`);
  }

  console.log('\n=== Checking Manufacturers ===');
  const mfrs = await db.select().from(mfgTable);
  for (const m of mfrs) {
    console.log(`ID ${m.id}: ${m.name}`);
  }

  console.log('\n=== Checking Spec Categories ===');
  const cats = await db.select().from(specCategories);
  for (const c of cats) {
    console.log(`ID ${c.id}: ${c.name} (dataType: ${c.dataType})`);
  }
}

checkData().catch(console.error);
