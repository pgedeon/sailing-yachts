import { NextResponse } from "next/server";
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
import { revalidateTag } from "next/cache";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Find yacht by slug
    const yachtResult = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(eq(yachtModels.slug, slug))
      .limit(1);

    if (yachtResult.length === 0) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const r = yachtResult[0];

    // Fetch all spec values with category info
    const specs = await db
      .select({
        category: specCategories.name,
        valueText: specValues.valueText,
        valueNumeric: specValues.valueNumeric,
        unit: specCategories.unit,
        group: specCategories.categoryGroup,
        displayOrder: specCategories.displayOrder,
      })
      .from(specValues)
      .leftJoin(
        specCategories,
        eq(specValues.specCategoryId, specCategories.id),
      )
      .where(eq(specValues.yachtModelId, r.yacht.id))
      .orderBy(specCategories.displayOrder);

    // Group specs by categoryGroup, ensuring non-null values and category presence
    const specsByGroup: Record<
      string,
      Array<{ category: string; value: number | string; unit?: string | null }>
    > = {};
    for (const s of specs) {
      if (!s.category) continue;
      const group = s.group || "other";
      if (!specsByGroup[group]) specsByGroup[group] = [];

      // Skip if both valueNumeric and valueText are null
      if (s.valueNumeric === null && s.valueText === null) continue;

      const value: number | string =
        s.valueNumeric !== null ? s.valueNumeric : (s.valueText as string);
      specsByGroup[group].push({
        category: s.category,
        value,
        unit: s.unit ?? undefined,
      });
    }

    // Fetch images
    const yachtImages = await db
      .select()
      .from(images)
      .where(eq(images.yachtModelId, r.yacht.id))
      .orderBy(images.sortOrder);

    // Fetch reviews (optional)
    const yachtReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.yachtModelId, r.yacht.id))
      .orderBy(reviews.reviewDate);

    const response = {
      id: r.yacht.id,
      manufacturer: r.manufacturer,
      modelName: r.yacht.modelName,
      year: r.yacht.year,
      slug: r.yacht.slug,
      // Core specs (nullable as per schema)
      lengthOverall: r.yacht.lengthOverall,
      beam: r.yacht.beam,
      draft: r.yacht.draft,
      displacement: r.yacht.displacement,
      ballast: r.yacht.ballast,
      sailAreaMain: r.yacht.sailAreaMain,
      rigType: r.yacht.rigType,
      keelType: r.yacht.keelType,
      hullMaterial: r.yacht.hullMaterial,
      cabins: r.yacht.cabins,
      berths: r.yacht.berths,
      heads: r.yacht.heads,
      maxOccupancy: r.yacht.maxOccupancy,
      engineHp: r.yacht.engineHp,
      engineType: r.yacht.engineType,
      fuelCapacity: r.yacht.fuelCapacity,
      waterCapacity: r.yacht.waterCapacity,
      designNotes: r.yacht.designNotes,
      description: r.yacht.description,
      adminLinks: r.yacht.adminLinks,
      sourceUrl: r.yacht.sourceUrl,
      sourceAttribution: r.yacht.sourceAttribution,
      specsByGroup,
      images: yachtImages.map((img: typeof images._.columns) => ({
        url: img.url,
        caption: img.caption,
        altText: img.altText,
        isPrimary: img.isPrimary,
      })),
      reviews: yachtReviews.map((rev: typeof reviews._.columns) => ({
        source: rev.source,
        rating: rev.rating,
        summary: rev.summary,
        fullText: rev.fullText,
        reviewDate: rev.reviewDate,
        authorName: rev.authorName,
        sourceUrl: rev.sourceUrl,
      })),
    };

    const jsonResponse = NextResponse.json(response);
    // P0: Ensure public API is non-cacheable at all layers
    jsonResponse.headers.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    jsonResponse.headers.set("Pragma", "no-cache");
    // P1: Tag for future cache invalidation
    if (r.yacht.slug) {
      jsonResponse.headers.set("x-next-revalidate-tag", `yacht:${r.yacht.slug}`);
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
