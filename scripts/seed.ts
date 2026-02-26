import { db } from "../lib/db";
import { yachts } from "../drizzle/schema";

const sampleYachts = [
  {
    id: "1",
    name: "Beneteau Oceanis 30.1",
    manufacturer: "Beneteau",
    lengthOverall: 9.08,
    beam: 3.24,
    draft: 1.5,
    displacement: 3700,
    year: 2023,
    imageUrl: null,
  },
  {
    id: "2",
    name: "Jeanneau Sun Odyssey 349",
    manufacturer: "Jeanneau",
    lengthOverall: 10.34,
    beam: 3.2,
    draft: 1.65,
    displacement: 4200,
    year: 2022,
    imageUrl: null,
  },
];

async function seed() {
  await db.delete(yachts);
  await db.insert(yachts).values(sampleYachts);
  console.log(`✅ Seeded ${sampleYachts.length} yachts`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
