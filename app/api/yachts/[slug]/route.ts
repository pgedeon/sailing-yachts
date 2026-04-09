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

        const response = {
          id: yacht.id,
          manufacturerId: yacht.manufacturerId,
          manufacturer: manufacturer,
          modelName: yacht.modelName,
          year: yacht.year,
          slug: yacht.slug,
          // Core specs (nullable as per schema)
          lengthOverall: yacht.lengthOverall,
          beam: yacht.beam,
          draft: yacht.draft,
          displacement: yacht.displacement,
          ballast: yacht.ballast,
          sailAreaMain: yacht.sailAreaMain,
          rigType: yacht.rigType,
          keelType: yacht.keelType,
          hullMaterial: yacht.hullMaterial,
          cabins: yacht.cabins,
          berths: yacht.berths,
          heads: yacht.heads,
          maxOccupancy: yacht.maxOccupancy,
          engineHp: yacht.engineHp,
          engineType: yacht.engineType,
          fuelCapacity: yacht.fuelCapacity,
          waterCapacity: yacht.waterCapacity,
          designNotes: yacht.designNotes,
          description: yacht.description,
          adminLinks: yacht.adminLinks,
          sourceUrl: yacht.sourceUrl,
          sourceAttribution: yacht.sourceAttribution,
          specsByGroup,
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
