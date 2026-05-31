import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getYachtVariants } from "@/lib/yachts";
import { db, yachtModels } from "@/lib/db-edge";
import { eq } from "drizzle-orm";

export const revalidate = 3600;
export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const cached = unstable_cache(
      async () => {
        // First get the current yacht to find its manufacturer and model name
        const yachtResult = await db
          .select({
            id: yachtModels.id,
            manufacturerId: yachtModels.manufacturerId,
            modelName: yachtModels.modelName,
          })
          .from(yachtModels)
          .where(eq(yachtModels.slug, slug))
          .limit(1);

        if (yachtResult.length === 0) return null;

        const { id, manufacturerId, modelName } = yachtResult[0];
        return getYachtVariants(id, manufacturerId, modelName);
      },
      [`yacht-variants:${slug}`],
      { tags: [`yacht:${slug}`, "yachts"], revalidate: 3600 },
    )();

    const variants = await cached;
    if (variants === null) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    return NextResponse.json({ variants });
  } catch (error) {
    console.error("Error fetching yacht variants:", error);
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 },
    );
  }
}
