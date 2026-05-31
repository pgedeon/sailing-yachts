import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db-edge module
vi.mock("@/lib/db-edge", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  },
  yachtModels: {
    id: "id",
    slug: "slug",
    modelName: "model_name",
    year: "year",
    manufacturerId: "manufacturer_id",
    lengthOverall: "length_overall",
    cabins: "cabins",
    displacement: "displacement",
  },
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
  desc: vi.fn(),
  asc: vi.fn(),
  sql: vi.fn((strings, ...values) => ({ sql: strings.join("?"), values })),
  inArray: vi.fn(),
  count: vi.fn(),
  isNotNull: vi.fn(),
}));

import { getYachtVariants, type YachtVariant } from "@/lib/yachts";
import { db } from "@/lib/db-edge";

describe("getYachtVariants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return variants for the same model name and manufacturer", async () => {
    const mockVariants: YachtVariant[] = [
      {
        id: 2,
        slug: "oceanis-40-1-2023",
        modelName: "Oceanis 40.1",
        year: 2023,
        lengthOverall: "12.43",
        cabins: 3,
        displacement: "8300",
      },
      {
        id: 3,
        slug: "oceanis-40-1-2019",
        modelName: "Oceanis 40.1",
        year: 2019,
        lengthOverall: "12.43",
        cabins: 2,
        displacement: "7900",
      },
    ];

    // Chain the mock to return data
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockVariants),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const result = await getYachtVariants(1, 10, "Oceanis 40.1");

    expect(result).toHaveLength(2);
    expect(result[0].slug).toBe("oceanis-40-1-2023");
    expect(result[1].slug).toBe("oceanis-40-1-2019");
    expect(db.select).toHaveBeenCalled();
  });

  it("should return empty array when no variants exist", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const result = await getYachtVariants(1, 10, "Unique Model");

    expect(result).toHaveLength(0);
  });

  it("should exclude the current yacht by id", async () => {
    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    await getYachtVariants(42, 10, "Oceanis 40.1");

    // The sql template should have been used in the where clause
    expect(chain.where).toHaveBeenCalled();
    expect(chain.from).toHaveBeenCalled();
  });

  it("should order variants by year descending", async () => {
    const mockVariants: YachtVariant[] = [
      { id: 3, slug: "test-2025", modelName: "Test", year: 2025, lengthOverall: null, cabins: null, displacement: null },
      { id: 2, slug: "test-2020", modelName: "Test", year: 2020, lengthOverall: null, cabins: null, displacement: null },
    ];

    const chain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue(mockVariants),
    };
    (db.select as ReturnType<typeof vi.fn>).mockReturnValue(chain);

    const result = await getYachtVariants(1, 10, "Test");

    expect(result[0].year).toBe(2025);
    expect(result[1].year).toBe(2020);
  });
});
