import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import {
  edgePool,
} from "@/lib/edge-pool";
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
export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const { slug } = params;

    // Use unstable_cache for 5-minute stale-while-revalidate
    const data = unstable_cache(
      async () => {
        const result = await getYachtDetailData(slug);
        if (!result) return null;

        const { yacht, manufacturer, manufacturerLogoUrl, specsByGroup, images, reviews } = result;

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

        // Fetch media assets using Edge-compatible pool
        const mediaResult = await edgePool.query(
          `SELECT id, media_type, title, description, url, embed_url, thumbnail_url,
                  source_url, file_format, file_size, caption, alt_text, is_primary, sort_order
           FROM media_assets
           WHERE yacht_model_id = $1
           ORDER BY sort_order, created_at`,
          [yacht.id],
        );

        const mediaAssets = mediaResult.rows.map((row: Record<string, unknown>) => ({
          id: toNum(row.id as string | number | null),
          mediaType: String(row.media_type ?? "photo"),
          title: (row.title as string) ?? null,
          description: (row.description as string) ?? null,
          url: (row.url as string) ?? null,
          embedUrl: (row.embed_url as string) ?? null,
          thumbnailUrl: (row.thumbnail_url as string) ?? null,
          sourceUrl: (row.source_url as string) ?? null,
          fileFormat: (row.file_format as string) ?? null,
          fileSize: toNum(row.file_size as string | number | null),
          caption: (row.caption as string) ?? null,
          altText: (row.alt_text as string) ?? null,
          isPrimary: row.is_primary === true || row.is_primary === "true",
          sortOrder: toNum(row.sort_order as string | number | null) ?? 0,
        }));

        const response = {
          id: yacht.id,
          manufacturerId: yacht.manufacturerId,
          manufacturer: manufacturer,
          manufacturerLogoUrl: manufacturerLogoUrl,
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
          dataSource: yacht.dataSource,
          sourceConfidence: toNum(yacht.sourceConfidence),
          lastVerifiedAt: yacht.lastVerifiedAt,
          completenessScore: toNum(yacht.completenessScore),
          specsByGroup: parsedSpecsByGroup,
          images,
          reviews,
          mediaAssets,
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
