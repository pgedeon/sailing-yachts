import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import {
  db,
  yachtModels,
  manufacturers,
  specValues,
  specCategories,
  images,
  reviews,
} from "@/lib/db";
import { eq } from "drizzle-orm";
import { getYachtDetailData } from "@/lib/yachts";

// Drizzle's `numeric` type returns strings from PostgreSQL.
// Convert to actual numbers for the JSON API so the client gets proper types.
function toNum(v: string | number | null): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

// ISR: Revalidate public API responses every 5 minutes for stale-while-revalidate
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Use unstable_cache for 5-minute stale-while-revalidate
    const data = unstable_cache(
      async () => {
        const result = await getYachtDetailData(slug);
        if (!result) return null;

        const { yacht, manufacturer, specsByGroup, images, reviews } = result;

        // Rebuild specsByGroup with numeric values properly parsed
        const parsedSpecsByGroup: Record<
          string,
          Array<{ category: string; value: number | string; unit?: string | null }>
        > = {};
        for (const [group, specs] of Object.entries(specsByGroup)) {
          parsedSpecsByGroup[group] = specs.map((s) => {
            const parsed = typeof s.value === "string" ? toNum(s.value) : s.value;
            return {
              category: s.category,
              value: parsed ?? s.value, // fall back to original string if NaN
              unit: s.unit,
            };
          });
        }

        const response = {
          id: yacht.id,
          manufacturerId: yacht.manufacturerId,
          manufacturer: manufacturer,
          modelName: yacht.modelName,
          year: yacht.year,
          slug: yacht.slug,
          // Core specs — convert Drizzle numeric strings to numbers
          lengthOverall: toNum(yacht.lengthOverall),
          beam: toNum(yacht.beam),
          draft: toNum(yacht.draft),
          displacement: toNum(yacht.displacement),
          ballast: toNum(yacht.ballast),
          sailAreaMain: toNum(yacht.sailAreaMain),
          rigType: yacht.rigType,
          keelType: yacht.keelType,
          hullMaterial: yacht.hullMaterial,
          cabins: yacht.cabins,
          berths: yacht.berths,
          heads: yacht.heads,
          maxOccupancy: yacht.maxOccupancy,
          engineHp: toNum(yacht.engineHp),
          engineType: yacht.engineType,
          fuelCapacity: toNum(yacht.fuelCapacity),
          waterCapacity: toNum(yacht.waterCapacity),
          designNotes: yacht.designNotes,
          description: yacht.description,
          adminLinks: yacht.adminLinks,
          sourceUrl: yacht.sourceUrl,
          sourceAttribution: yacht.sourceAttribution,
          specsByGroup: parsedSpecsByGroup,
          images,
          reviews,
        };

        return response;
      },
      [`api:yacht:${slug}`],
      { tags: [`yacht:${slug}`, "yachts"], revalidate: 300 }
    )();

    const result = await data;

    if (!result) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const jsonResponse = NextResponse.json(result);

    // Explicitly revalidate when data changes via admin API
    // The admin routes already call revalidateTag() on mutations
    // This header allows future on-demand invalidation
    if (result.slug) {
      jsonResponse.headers.set("x-next-revalidate-tag", `yacht:${result.slug}`);
    } else {
      jsonResponse.headers.set("x-next-revalidate-tag", "yachts");
    }

    return jsonResponse;
  } catch (error) {
    console.error("Error fetching yacht:", error);
    return NextResponse.json(
      { error: "Failed to fetch yacht" },
      { status: 500 },
    );
  }
}
