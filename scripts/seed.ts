import { db } from "../lib/db";
import {
  manufacturers,
  yachtModels,
  specCategories,
  specValues,
  images,
} from "../drizzle/schema";
import { inArray, sql } from "drizzle-orm";

// Pre-populated spec categories based on typical yacht specs
const initialSpecCategories = [
  {
    name: "Length Overall",
    unit: "m",
    dataType: "numeric",
    categoryGroup: "dimensions",
    displayOrder: 1,
    isFilterable: true,
    isSortable: true,
    isComparable: true,
    description: "Total length of the yacht including bowsprit",
  },
  {
    name: "Length Waterline",
    unit: "m",
    dataType: "numeric",
    categoryGroup: "dimensions",
    displayOrder: 2,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Beam",
    unit: "m",
    dataType: "numeric",
    categoryGroup: "dimensions",
    displayOrder: 3,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Draft",
    unit: "m",
    dataType: "numeric",
    categoryGroup: "dimensions",
    displayOrder: 4,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Displacement",
    unit: "kg",
    dataType: "numeric",
    categoryGroup: "performance",
    displayOrder: 1,
    isFilterable: true,
    isSortable: true,
    isComparable: true,
  },
  {
    name: "Ballast",
    unit: "kg",
    dataType: "numeric",
    categoryGroup: "performance",
    displayOrder: 2,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Sail Area Main",
    unit: "m²",
    dataType: "numeric",
    categoryGroup: "sailplan",
    displayOrder: 1,
    isFilterable: false,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Sail Area Genoa",
    unit: "m²",
    dataType: "numeric",
    categoryGroup: "sailplan",
    displayOrder: 2,
    isFilterable: false,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Sail Area Spinnaker",
    unit: "m²",
    dataType: "numeric",
    categoryGroup: "sailplan",
    displayOrder: 3,
    isFilterable: false,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Rig Type",
    unit: "",
    dataType: "text",
    categoryGroup: "sailplan",
    displayOrder: 4,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Keel Type",
    unit: "",
    dataType: "text",
    categoryGroup: "hull",
    displayOrder: 1,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Hull Material",
    unit: "",
    dataType: "text",
    categoryGroup: "hull",
    displayOrder: 2,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Cabins",
    unit: "",
    dataType: "numeric",
    categoryGroup: "accommodation",
    displayOrder: 1,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Berths",
    unit: "",
    dataType: "numeric",
    categoryGroup: "accommodation",
    displayOrder: 2,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Heads",
    unit: "",
    dataType: "numeric",
    categoryGroup: "accommodation",
    displayOrder: 3,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Max Occupancy",
    unit: "",
    dataType: "numeric",
    categoryGroup: "accommodation",
    displayOrder: 4,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Engine HP",
    unit: "hp",
    dataType: "numeric",
    categoryGroup: "technical",
    displayOrder: 1,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Engine Type",
    unit: "",
    dataType: "text",
    categoryGroup: "technical",
    displayOrder: 2,
    isFilterable: false,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Fuel Capacity",
    unit: "liters",
    dataType: "numeric",
    categoryGroup: "technical",
    displayOrder: 3,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
  {
    name: "Water Capacity",
    unit: "liters",
    dataType: "numeric",
    categoryGroup: "technical",
    displayOrder: 4,
    isFilterable: true,
    isSortable: false,
    isComparable: true,
  },
];

// Sample manufacturers
const sampleManufacturers = [
  {
    name: "Beneteau",
    country: "France",
    foundedYear: 1884,
    website: "https://www.beneteau.com",
  },
  {
    name: "Jeanneau",
    country: "France",
    foundedYear: 1957,
    website: "https://www.jeanneau.com",
  },
  {
    name: "Catalina",
    country: "USA",
    foundedYear: 1969,
    website: "https://www.catalinayachts.com",
  },
  {
    name: "Hunter",
    country: "USA",
    foundedYear: 1973,
    website: "https://www.huntermarine.com",
  },
  {
    name: "Bavaria",
    country: "Germany",
    foundedYear: 1978,
    website: "https://www.bavariayachts.com",
  },
  {
    name: "Dufour",
    country: "France",
    foundedYear: 1924,
    website: "https://www.dufour-yachts.com",
  },
  {
    name: "Swan",
    country: "Finland",
    foundedYear: 1966,
    website: "https://www.oyal-swann.com",
  },
];

// Sample yachts across size categories
const sampleYachts = [
  // SMALL (< 10m)
  {
    manufacturer: "Catalina",
    modelName: "Catalina 22",
    year: 2022,
    lengthOverall: 6.7,
    beam: 2.6,
    draft: 1.1,
    displacement: 1400,
    ballast: 500,
    sailAreaMain: 15.0,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 1,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 10,
    engineType: "outboard",
    fuelCapacity: 25,
    waterCapacity: 75,
    description: "A popular small family cruiser perfect for weekend getaways.",
    sourceUrl: "https://www.catalinayachts.com/catalina-22/",
    sourceAttribution: "Catalina Yachts",
    images: [
      {
        url: "https://example.com/catalina-22-1.jpg",
        caption: "Catalina 22 side view",
        isPrimary: true,
        altText: "Catalina 22 sailing",
      },
    ],
    specs: {
      "Water Capacity": 75,
      "Fuel Capacity": 25,
      "Sail Area Total": 21.5,
    },
  },
  {
    manufacturer: "Hunter",
    modelName: "Hunter 23",
    year: 2021,
    lengthOverall: 7.01,
    beam: 2.59,
    draft: 0.61,
    displacement: 1600,
    ballast: 600,
    sailAreaMain: 16.8,
    rigType: "sloop",
    keelType: "wing",
    hullMaterial: "fiberglass",
    cabins: 1,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 9.9,
    engineType: "outboard",
    fuelCapacity: 28,
    waterCapacity: 65,
    description:
      "Compact trailerable sailer with deep cockpit and comfortable interior.",
    sourceUrl: "https://www.huntermarine.com/hunter-23/",
    sourceAttribution: "Hunter Marine",
    images: [
      {
        url: "https://example.com/hunter-23-1.jpg",
        caption: "Hunter 23 on the water",
        isPrimary: true,
        altText: "Hunter 23",
      },
    ],
    specs: {
      "Sail Area Total": 23.7,
      "Maximum Draft": 1.5,
    },
  },
  {
    manufacturer: "Catalina",
    modelName: "Catalina 27",
    year: 2020,
    lengthOverall: 8.23,
    beam: 2.74,
    draft: 1.35,
    displacement: 2500,
    ballast: 900,
    sailAreaMain: 22.0,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 2,
    berths: 5,
    heads: 1,
    maxOccupancy: 5,
    engineHp: 15,
    engineType: "diesel",
    fuelCapacity: 40,
    waterCapacity: 100,
    description:
      "Classic coastal cruiser with comfortable accommodations and solid performance.",
    sourceUrl: "https://www.catalinayachts.com/catalina-27/",
    sourceAttribution: "Catalina Yachts",
    images: [
      {
        url: "https://example.com/catalina-27-1.jpg",
        caption: "Catalina 27 deck",
        isPrimary: true,
        altText: "Catalina 27",
      },
    ],
    specs: {
      "Sail Area Total": 29.0,
      "Mast Height": 11.0,
    },
  },

  // MEDIUM (10-14m)
  {
    manufacturer: "Beneteau",
    modelName: "Oceanis 31",
    year: 2023,
    lengthOverall: 9.63,
    beam: 3.28,
    draft: 1.8,
    displacement: 3800,
    ballast: 1300,
    sailAreaMain: 26.0,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 2,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 21,
    engineType: "diesel",
    fuelCapacity: 60,
    waterCapacity: 200,
    description:
      "Modern family cruiser with excellent living space and easy handling.",
    sourceUrl: "https://www.beneteau.com/oceanis-31/",
    sourceAttribution: "Beneteau",
    images: [
      {
        url: "https://example.com/oceanis-31-1.jpg",
        caption: "Oceanis 31 sailing",
        isPrimary: true,
        altText: "Beneteau Oceanis 31",
      },
    ],
    specs: {
      "Sail Area Total": 35.0,
      LWL: 8.65,
      "Airl draft": 14.1,
    },
  },
  {
    manufacturer: "Jeanneau",
    modelName: "Sun Odyssey 30i",
    year: 2022,
    lengthOverall: 9.12,
    beam: 3.15,
    draft: 1.85,
    displacement: 3200,
    ballast: 1100,
    sailAreaMain: 24.5,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 2,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 20,
    engineType: "diesel",
    fuelCapacity: 55,
    waterCapacity: 180,
    description: "Elegant performance cruiser with a modern hull design.",
    sourceUrl:
      "https://www.jeanneau.com/en-gb/boats/sailboat/3-sun-odyssey-30i/",
    sourceAttribution: "Jeanneau",
    images: [
      {
        url: "https://example.com/sun-odyssey-30i-1.jpg",
        caption: "Sun Odyssey 30i",
        isPrimary: true,
        altText: "Jeanneau Sun Odyssey 30i",
      },
    ],
    specs: {
      "Sail Area Total": 32.5,
      "Comfort Ratio": 28.5,
    },
  },
  {
    manufacturer: "Bavaria",
    modelName: "Bavaria 30C",
    year: 2023,
    lengthOverall: 9.25,
    beam: 3.33,
    draft: 1.7,
    displacement: 3500,
    ballast: 1200,
    sailAreaMain: 25.5,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 2,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 22,
    engineType: "diesel",
    fuelCapacity: 58,
    waterCapacity: 190,
    description:
      "German engineering meets modern design in this versatile cruiser.",
    sourceUrl: "https://www.bavariayachts.com/en/yachts/bavaria-c30/",
    sourceAttribution: "Bavaria Yachts",
    images: [
      {
        url: "https://example.com/bavaria-30c-1.jpg",
        caption: "Bavaria 30C",
        isPrimary: true,
        altText: "Bavaria 30C",
      },
    ],
    specs: {
      "Sail Area Total": 34.0,
      "D-SWL": 8.8,
    },
  },
  {
    manufacturer: "Dufour",
    modelName: "Dufour 31",
    year: 2022,
    lengthOverall: 9.5,
    beam: 3.3,
    draft: 1.9,
    displacement: 3700,
    ballast: 1400,
    sailAreaMain: 25.2,
    rigType: "sloop",
    keelType: "bulb fin",
    hullMaterial: "fiberglass",
    cabins: 2,
    berths: 4,
    heads: 1,
    maxOccupancy: 4,
    engineHp: 21,
    engineType: "diesel",
    fuelCapacity: 62,
    waterCapacity: 195,
    description:
      "French performance cruiser with excellent upwind capabilities.",
    sourceUrl: "https://www.dufour-yachts.com/en/31-performance/",
    sourceAttribution: "Dufour Yachts",
    images: [
      {
        url: "https://example.com/dufour-31-1.jpg",
        caption: "Dufour 31",
        isPrimary: true,
        altText: "Dufour 31",
      },
    ],
    specs: {
      "Sail Area Total": 36.5,
      "PHRF Rating": 120,
    },
  },

  // LARGE (14-18m)
  {
    manufacturer: "Beneteau",
    modelName: "Oceanis 46.1",
    year: 2023,
    lengthOverall: 14.0,
    beam: 4.55,
    draft: 2.25,
    displacement: 11000,
    ballast: 3700,
    sailAreaMain: 48.5,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 4,
    berths: 8,
    heads: 3,
    maxOccupancy: 8,
    engineHp: 75,
    engineType: "diesel",
    fuelCapacity: 300,
    waterCapacity: 560,
    description:
      "Spacious long-range cruiser with innovative hull design and abundant light.",
    sourceUrl: "https://www.beneteau.com/oceanis-46-1/",
    sourceAttribution: "Beneteau",
    images: [
      {
        url: "https://example.com/oceanis-46-1.jpg",
        caption: "Oceanis 46.1",
        isPrimary: true,
        altText: "Oceanis 46.1",
      },
    ],
    specs: {
      "Sail Area Total": 78.0,
      LWL: 12.95,
      "Comfort Ratio": 32.1,
      "PHRF Rating": 75,
    },
  },
  {
    manufacturer: "Jeanneau",
    modelName: "Sun Odyssey 45.2",
    year: 2022,
    lengthOverall: 13.69,
    beam: 4.45,
    draft: 2.15,
    displacement: 10200,
    ballast: 3400,
    sailAreaMain: 46.2,
    rigType: "sloop",
    keelType: "fin",
    hullMaterial: "fiberglass",
    cabins: 4,
    berths: 8,
    heads: 3,
    maxOccupancy: 8,
    engineHp: 70,
    engineType: "diesel",
    fuelCapacity: 280,
    waterCapacity: 520,
    description:
      "Elegant performance cruiser with balanced lines and spacious interior.",
    sourceUrl:
      "https://www.jeanneau.com/en-gb/boats/sailboat/17-sun-odyssey-45-2/",
    sourceAttribution: "Jeanneau",
    images: [
      {
        url: "https://example.com/sun-odyssey-45-2.jpg",
        caption: "Sun Odyssey 45.2",
        isPrimary: true,
        altText: "Sun Odyssey 45.2",
      },
    ],
    specs: {
      "Sail Area Total": 74.5,
      "Airl draft": 20.6,
    },
  },
  {
    manufacturer: "Swan",
    modelName: "Swan 48",
    year: 2021,
    lengthOverall: 14.78,
    beam: 4.31,
    draft: 2.4,
    displacement: 12500,
    ballast: 4500,
    sailAreaMain: 52.0,
    rigType: "sloop",
    keelType: "bulb fin",
    hullMaterial: "fiberglass",
    cabins: 4,
    berths: 8,
    heads: 3,
    maxOccupancy: 8,
    engineHp: 75,
    engineType: "diesel",
    fuelCapacity: 320,
    waterCapacity: 600,
    description:
      "Finland's finest: world-class cruising performance with unmatched build quality.",
    sourceUrl: "https://www.oyal-swann.com/models/swan-48/",
    sourceAttribution: "Swan",
    images: [
      {
        url: "https://example.com/swan-48-1.jpg",
        caption: "Swan 48",
        isPrimary: true,
        altText: "Swan 48",
      },
    ],
    specs: {
      "Sail Area Total": 85.0,
      "PHRF Rating": 42,
      "Comfort Ratio": 40.2,
    },
  },
];

async function seed() {
  console.log("Starting database seed...\n");

  // Check if data already exists
  const existingYachts = await db.select().from(yachtModels).limit(1);
  if (existingYachts.length > 0) {
    console.log("Database already seeded. Skipping...");
    return;
  }

  try {
    console.log("Inserting spec categories...");
    for (const cat of initialSpecCategories) {
      await db
        .insert(specCategories)
        .values(cat as any)
        .onConflictDoNothing();
    }
    const allSpecCats = await db.select().from(specCategories);
    console.log(`  ✓ Inserted ${allSpecCats.length} spec categories`);

    console.log("\nInserting manufacturers...");
    const mIds = new Map<string, number>();
    for (const m of sampleManufacturers) {
      const [result] = await db
        .insert(manufacturers)
        .values(m as any)
        .onConflictDoUpdate({ target: manufacturers.name, set: m as any })
        .returning({ id: manufacturers.id });
      mIds.set(m.name, result.id);
    }
    console.log(`  ✓ Inserted/updated ${mIds.size} manufacturers`);

    console.log("\nInserting yachts...");
    for (const yacht of sampleYachts) {
      const mfid = mIds.get(yacht.manufacturer);
      if (!mfid)
        throw new Error(`Manufacturer ${yacht.manufacturer} not found`);

      const slug = `${yacht.manufacturer.toLowerCase().replace(/\s+/g, "-")}-${yacht.modelName.toLowerCase().replace(/\s+/g, "-")}`;

      // Build yacht values as any to bypass strict typing
      const yachtValues = {
        manufacturerId: mfid,
        modelName: yacht.modelName,
        year: yacht.year,
        slug,
        lengthOverall: yacht.lengthOverall as any,
        beam: yacht.beam as any,
        draft: yacht.draft as any,
        displacement: yacht.displacement as any,
        ballast: yacht.ballast as any,
        sailAreaMain: yacht.sailAreaMain as any,
        rigType: yacht.rigType,
        keelType: yacht.keelType,
        hullMaterial: yacht.hullMaterial,
        cabins: yacht.cabins as any,
        berths: yacht.berths as any,
        heads: yacht.heads as any,
        maxOccupancy: yacht.maxOccupancy as any,
        engineHp: yacht.engineHp as any,
        engineType: yacht.engineType,
        fuelCapacity: yacht.fuelCapacity as any,
        waterCapacity: yacht.waterCapacity as any,
        description: yacht.description,
        sourceUrl: yacht.sourceUrl,
        sourceAttribution: yacht.sourceAttribution,
        adminLinks: [],
      };

      const [yachtRec] = await db
        .insert(yachtModels)
        .values(yachtValues as any)
        .onConflictDoUpdate({
          target: yachtModels.slug,
          set: yachtValues as any,
        })
        .returning({ id: yachtModels.id });

      // Insert images
      if (yacht.images?.length) {
        const imgVals = yacht.images.map((img, i) => ({
          yachtModelId: yachtRec.id,
          url: img.url,
          caption: img.caption,
          isPrimary: img.isPrimary ?? i === 0,
          altText: img.altText,
          sortOrder: i,
        }));
        await db.insert(images).values(imgVals as any);
      }

      // Insert spec values
      if (yacht.specs) {
        const names = Object.keys(yacht.specs);
        const existingCats = await db
          .select()
          .from(specCategories)
          .where(inArray(specCategories.name, names));
        const existingNames = new Set(existingCats.map((c) => c.name));
        const missing = names.filter((n) => !existingNames.has(n));
        for (const name of missing) {
          await db
            .insert(specCategories)
            .values({
              name,
              dataType: "numeric",
              categoryGroup: "custom",
              isFilterable: true,
              isSortable: true,
              isComparable: true,
            } as any)
            .onConflictDoNothing();
        }
        const neededCats = await db
          .select()
          .from(specCategories)
          .where(inArray(specCategories.name, names));
        const catById = new Map(neededCats.map((c) => [c.name, c.id]));
        const svPromises = names.map((n) => {
          const catId = catById.get(n)!;
          const val = (yacht as any).specs[n];
          const valueNumeric = typeof val === "number" ? val : null;
          const valueText = typeof val === "string" ? val : null;
          return db
            .insert(specValues)
            .values({
              yachtModelId: yachtRec.id,
              specCategoryId: catId,
              valueNumeric: valueNumeric as any,
              valueText: valueText as any,
            } as any)
            .onConflictDoUpdate({
              target: [specValues.yachtModelId, specValues.specCategoryId],
              set: {
                valueNumeric: valueNumeric as any,
                valueText: valueText as any,
              },
            } as any);
        });
        await Promise.all(svPromises);
      }

      console.log(`  ✓ ${yacht.modelName} (${yacht.year})`);
    }

    const countResult = await db
      .select({ count: sql`count(*)` })
      .from(yachtModels);
    // @ts-ignore - sql returns any
    const count = Number(countResult[0].count);
    console.log(`\n✓ Seeded ${count} yachts successfully!`);
  } catch (err) {
    console.error("Seed failed:", err);
    throw err;
  }
}

seed()
  .then(() => {
    console.log("Done.");
    process.exit(0);
  })
  .catch((e) => {
    console.error("ERROR:", e);
    process.exit(1);
  });
