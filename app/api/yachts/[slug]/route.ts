import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getYachtDetailData } from "@/lib/yachts";
import { transformYachtData } from "@/lib/yacht-transform";

// ISR: Revalidate public API responses every 5 minutes for stale-while-revalidate
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const data = unstable_cache(
      async () => {
        const result = await getYachtDetailData(slug);
        if (!result) return null;
        return transformYachtData(result);
      },
      [`api:yacht:${slug}`],
      { tags: [`yacht:${slug}`, "yachts"], revalidate: 300 }
    )();

    const result = await data;

    if (!result) {
      return NextResponse.json({ error: "Yacht not found" }, { status: 404 });
    }

    const jsonResponse = NextResponse.json(result);

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
