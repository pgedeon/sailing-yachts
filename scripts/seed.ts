import "dotenv/config";
import { db } from "../lib/db";
import {
  yachtModels,
  manufacturers,
  specCategories,
  specValues,
  images,
} from "../drizzle/schema";

const sampleManufacturers = [
  {
    name: "Beneteau",
    country: "France",
    foundedYear: 1884,
    description: "French sailboat manufacturer known for cruising yachts",
    websiteUrl: "https://www.beneteau.com",
    logoUrl: null,
  },
  {
    name: "Jeanneau",
    country: "France",
    foundedYear: 1955,
    description: "French sailboat manufacturer specializing in cruising yachts",
    websiteUrl: "https://www.jeanneau.com",
    logoUrl: null,
  },
  {
    name: "Hallberg-Rassy",
    country: "Sweden",
    foundedYear: 1943,
    description: "Swedish sailboat manufacturer known for bluewater cruisers",
    websiteUrl: "https://www.hallberg-rassy.com",
    logoUrl: null,
  },
];

const sampleSpecCategories = [
  {
    name: "Ballast",
    unit: "kg",
    dataType: "numeric" as const,
    categoryGroup: "Construction",
    isFilterable: true,
    description: "Weight of ballast (lead or iron)",
  },
  {
    name: "Sail Area Main",
    unit: "m²",
    dataType: "numeric" as const,
    categoryGroup: "Rigging",
    isFilterable: true,
    description: "Area of main sail",
  },
  {
    name: "Sail Area Jib",
    unit: "m²",
    dataType: "numeric" as const,
    categoryGroup: "Rigging",
    isFilterable: true,
    description: "Area of jib/genoa sail",
  },
  {
    name: "Engine Type",
    unit: null,
    dataType: "text" as const,
    categoryGroup: "Technical",
    isFilterable: true,
    description: "Type of engine (diesel, electric, etc.)",
  },
  {
    name: "Fuel Capacity",
    unit: "L",
    dataType: "numeric" as const,
    categoryGroup: "Technical",
    isFilterable: true,
    description: "Fuel tank capacity",
  },
];

const sampleYachtModels = [
  {
    manufacturerId: 1, // Beneteau
    modelName: "Oceanis 30.1",
    year: 2023,
    slug: "beneteau-oceanis-30-1",
    lengthOverall: 9.08,
    beam: 3.24,
    draft: 1.5,
    displacement: 3700,
    ballast: 1200,
    sailAreaMain: 36.0,
    rigType: "Sloop",
    keelType: "Fin keel",
    hullMaterial: "Fiberglass",
    cabins: 1,
    berths: 4,
    heads: 1,
    maxOccupancy: 6,
    engineHp: 20.0,
    engineType: "Diesel",
    fuelCapacity: 90.0,
    waterCapacity: 85.0,
    designNotes: "Modern cruising sailboat with comfortable interior",
    description: 
      "The Oceanis 30.1 is a versatile cruising sailboat designed for comfort and performance.",
    sourceUrl: null,
    sourceAttribution: null,
    adminLinks: [],
  },
  {
    manufacturerId: 2, // Jeanneau
    modelName: "Sun Odyssey 349",
    year: 2022,
    slug: "jeanneau-sun-odyssey-349",
    lengthOverall: 10.34,
    beam: 3.2,
    draft: 1.65,
    displacement: 4200,
    ballast: 1400,
    sailAreaMain: 48.5,
    rigType: "Sloop",
    keelType: "Fin keel with bulb",
    hullMaterial: "Fiberglass",
    cabins: 2,
    berths: 6,
    heads: 1,
    maxOccupancy: 8,
    engineHp: 21.0,
    engineType: "Diesel",
    fuelCapacity: 130.0,
    waterCapacity: 150.0,
    designNotes: "Spacious interior with large cockpit",
    description: 
      "The Sun Odyssey 349 offers excellent space and comfort for cruising.",
    sourceUrl: null,
    sourceAttribution: null,
    adminLinks: [],
  },
  {
    manufacturerId: 1, // Beneteau
    modelName: "Oceanis 38.1",
    year: 2024,
    slug: "beneteau-oceanis-38-1",
    lengthOverall: 11.5,
    beam: 3.76,
    draft: 1.7,
    displacement: 6200,
    ballast: 1900,
    sailAreaMain: 45.0,
    rigType: "Sloop",
    keelType: "Fin keel with bulb",
    hullMaterial: "Fiberglass",
    cabins: 2,
    berths: 6,
    heads: 2,
    maxOccupancy: 8,
    engineHp: 30.0,
    engineType: "Diesel",
    fuelCapacity: 195.0,
    waterCapacity: 245.0,
    designNotes: "Larger cruising yacht with excellent performance",
    description: 
      "The Oceanis 38.1 is a larger cruising sailboat perfect for extended voyages.",
    sourceUrl: null,
    sourceAttribution: null,
    adminLinks: [],
  },
];

const sampleSpecValues = [
  // Ballast values
  { yachtModelId: 1, specCategoryId: 1, valueNumeric: 1200.0 },
  { yachtModelId: 2, specCategoryId: 1, valueNumeric: 1400.0 },
  { yachtModelId: 3, specCategoryId: 1, valueNumeric: 1900.0 },
  // Sail Area Main values
  { yachtModelId: 1, specCategoryId: 2, valueNumeric: 36.0 },
  { yachtModelId: 2, specCategoryId: 2, valueNumeric: 48.5 },
  { yachtModelId: 3, specCategoryId: 2, valueNumeric: 45.0 },
  // Sail Area Jib values
  { yachtModelId: 1, specCategoryId: 3, valueNumeric: 28.0 },
  { yachtModelId: 2, specCategoryId: 3, valueNumeric: 34.0 },
  { yachtModelId: 3, specCategoryId: 3, valueNumeric: 39.5 },
  // Engine Type values
  { yachtModelId: 1, specCategoryId: 4, valueText: "Diesel" },
  { yachtModelId: 2, specCategoryId: 4, valueText: "Diesel" },
  { yachtModelId: 3, specCategoryId: 4, valueText: "Diesel" },
  // Fuel Capacity values
  { yachtModelId: 1, specCategoryId: 5, valueNumeric: 90.0 },
  { yachtModelId: 2, specCategoryId: 5, valueNumeric: 130.0 },
  { yachtModelId: 3, specCategoryId: 5, valueNumeric: 195.0 },
];

const sampleImages = [
  {
    yachtModelId: 1,
    url: "https://example.com/images/beneteau-oceanis-30-1-1.jpg",
    caption: "Beneteau Oceanis 30.1 - Port side",
    isPrimary: true,
    altText: "Beneteau Oceanis 30.1 sailboat",
    sortOrder: 1,
  },
  {
    yachtModelId: 1,
    url: "https://example.com/images/beneteau-oceanis-30-1-2.jpg",
    caption: "Beneteau Oceanis 30.1 - Cockpit view",
    isPrimary: false,
    altText: "Beneteau Oceanis 30.1 cockpit",
    sortOrder: 2,
  },
  {
    yachtModelId: 2,
    url: "https://example.com/images/jeanneau-sun-odyssey-349-1.jpg",
    caption: "Jeanneau Sun Odyssey 349 - Starboard side",
    isPrimary: true,
    altText: "Jeanneau Sun Odyssey 349 sailboat",
    sortOrder: 1,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data (in reverse order of dependencies)
  await db.delete(images);
  await db.delete(specValues);
  await db.delete(yachtModels);
  await db.delete(specCategories);
  await db.delete(manufacturers);

  // Insert manufacturers
  console.log("🏭 Seeding manufacturers...");
  const insertedManufacturers = await db
    .insert(manufacturers)
    .values(sampleManufacturers)
    .returning();
  console.log(`✅ Seeded ${insertedManufacturers.length} manufacturers`);

  // Insert spec categories
  console.log("📊 Seeding spec categories...");
  const insertedCategories = await db
    .insert(specCategories)
    .values(sampleSpecCategories)
    .returning();
  console.log(`✅ Seeded ${insertedCategories.length} spec categories`);

  // Insert yacht models (using manufacturer IDs from inserted data)
  console.log("⛵ Seeding yacht models...");
  const beneteau = insertedManufacturers.find((m: any) => m.name === "Beneteau");
  const jeanneau = insertedManufacturers.find((m: any) => m.name === "Jeanneau");
  
  if (!beneteau || !jeanneau) {
    throw new Error("Required manufacturers not found");
  }
  
  const yachtModelsWithIds = sampleYachtModels.map((yacht) => {
    if (yacht.manufacturerId === 1) {
      return { ...yacht, manufacturerId: beneteau.id };
    } else if (yacht.manufacturerId === 2) {
      return { ...yacht, manufacturerId: jeanneau.id };
    }
    return yacht;
  });
  
  const insertedYachts = await db
    .insert(yachtModels)
    .values(yachtModelsWithIds)
    .returning();
  console.log(`✅ Seeded ${insertedYachts.length} yacht models`);

  // Insert spec values (using actual yacht model IDs and category IDs)
  console.log("📈 Seeding spec values...");
  const ballastCat = insertedCategories.find((c: any) => c.name === "Ballast");
  const sailAreaMainCat = insertedCategories.find((c: any) => c.name === "Sail Area Main");
  const sailAreaJibCat = insertedCategories.find((c: any) => c.name === "Sail Area Jib");
  const engineTypeCat = insertedCategories.find((c: any) => c.name === "Engine Type");
  const fuelCapacityCat = insertedCategories.find((c: any) => c.name === "Fuel Capacity");
  
  if (!ballastCat || !sailAreaMainCat || !sailAreaJibCat || !engineTypeCat || !fuelCapacityCat) {
    throw new Error("Required spec categories not found");
  }
  
  const specValuesWithIds = sampleSpecValues.map((sv) => {
    let categoryId: number | undefined;
    if (sv.specCategoryId === 1) categoryId = ballastCat.id;
    else if (sv.specCategoryId === 2) categoryId = sailAreaMainCat.id;
    else if (sv.specCategoryId === 3) categoryId = sailAreaJibCat.id;
    else if (sv.specCategoryId === 4) categoryId = engineTypeCat.id;
    else if (sv.specCategoryId === 5) categoryId = fuelCapacityCat.id;
    
    let yachtModelId: number | undefined;
    if (sv.yachtModelId === 1 && insertedYachts[0]) yachtModelId = insertedYachts[0].id;
    else if (sv.yachtModelId === 2 && insertedYachts[1]) yachtModelId = insertedYachts[1].id;
    else if (sv.yachtModelId === 3 && insertedYachts[2]) yachtModelId = insertedYachts[2].id;
    
    if (!categoryId || !yachtModelId) {
      throw new Error(`Missing IDs for spec value`);
    }
    
    return { ...sv, yachtModelId, specCategoryId: categoryId };
  });
  await db.insert(specValues).values(specValuesWithIds);
  const specCount = sampleSpecValues.length;
  console.log(`✅ Seeded ${specCount} spec values`);

  // Insert images (using actual yacht model IDs)
  console.log("🖼️ Seeding images...");
  const imagesWithIds = sampleImages.map((img) => {
    if (img.yachtModelId === 1 && insertedYachts[0]) return { ...img, yachtModelId: insertedYachts[0].id };
    else if (img.yachtModelId === 2 && insertedYachts[1]) return { ...img, yachtModelId: insertedYachts[1].id };
    throw new Error(`No yacht model found for ID ${img.yachtModelId}`);
  });
  await db.insert(images).values(imagesWithIds);
  const imageCount = sampleImages.length;
  console.log(`✅ Seeded ${imageCount} images`);

  console.log("\n🎉 Database seeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });