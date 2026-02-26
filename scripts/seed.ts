import { db } from "../lib/db";
import { yachts } from "../drizzle/schema";
import { randomUUID } from "crypto";

const sampleYachts = [
  {
    id: randomUUID(),
    name: "Beneteau Oceanis 46.1",
    manufacturer: "Beneteau",
    lengthOverall: 45.9,
    beam: 14.1,
    draft: 4.9,
    displacement: 22472,
    year: 2022,
    imageUrl: "https://via.placeholder.com/300x200?text=Beneteau+Oceanis+46.1",
  },
  {
    id: randomUUID(),
    name: "Jeanneau Sun Odyssey 490",
    manufacturer: "Jeanneau",
    lengthOverall: 48.5,
    beam: 14.8,
    draft: 5.6,
    displacement: 28420,
    year: 2021,
    imageUrl: "https://via.placeholder.com/300x200?text=Jeanneau+Sun+Odyssey+490",
  },
  {
    id: randomUUID(),
    name: "X-Yachts X4.0",
    manufacturer: "X-Yachts",
    lengthOverall: 41.3,
    beam: 13.3,
    draft: 5.2,
    displacement: 22046,
    year: 2020,
    imageUrl: "https://via.placeholder.com/300x200?text=X-Yachts+X4.0",
  },
  {
    id: randomUUID(),
    name: "Hanse 460",
    manufacturer: "Hanse",
    lengthOverall: 45.9,
    beam: 14.6,
    draft: 4.9,
    displacement: 24250,
    year: 2023,
    imageUrl: "https://via.placeholder.com/300x200?text=Hanse+460",
  },
  {
    id: randomUUID(),
    name: "Grand Soleil 43",
    manufacturer: "Grand Soleil",
    lengthOverall: 42.3,
    beam: 13.9,
    draft: 4.8,
    displacement: 20730,
    year: 2022,
    imageUrl: "https://via.placeholder.com/300x200?text=Grand+Soleil+43",
  },
  {
    id: randomUUID(),
    name: "Dufour 430",
    manufacturer: "Dufour",
    lengthOverall: 43.3,
    beam: 13.9,
    draft: 4.8,
    displacement: 22046,
    year: 2021,
    imageUrl: "https://via.placeholder.com/300x200?text=Dufour+430",
  },
  {
    id: randomUUID(),
    name: "Bavaria Cruiser 41",
    manufacturer: "Bavaria",
    lengthOverall: 40.9,
    beam: 13.3,
    draft: 4.6,
    displacement: 19842,
    year: 2021,
    imageUrl: "https://via.placeholder.com/300x200?text=Bavaria+Cruiser+41",
  },
  {
    id: randomUUID(),
    name: "Sunfast 3300",
    manufacturer: "Jeanneau",
    lengthOverall: 32.8,
    beam: 10.9,
    draft: 6.2,
    displacement: 11464,
    year: 2020,
    imageUrl: "https://via.placeholder.com/300x200?text=Sunfast+3300",
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
