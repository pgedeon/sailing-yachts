import { NextResponse } from "next/server";
import {
  getRelatedArticles,
  addAffiliateTag,
} from "@/lib/sailboat-articles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const manufacturer = searchParams.get("manufacturer") || "";
  const loa = searchParams.get("loa");
  const rig = searchParams.get("rig") || null;
  const keel = searchParams.get("keel") || null;
  const hull = searchParams.get("hull") || null;
  const cabins = searchParams.get("cabins");
  const displacement = searchParams.get("displacement");

  const articles = getRelatedArticles(
    {
      manufacturer,
      lengthOverall: loa ? parseFloat(loa) : null,
      rigType: rig,
      keelType: keel,
      hullMaterial: hull,
      cabins: cabins ? parseInt(cabins, 10) : null,
      displacement: displacement ? parseFloat(displacement) : null,
    },
    4,
  );

  const enriched = articles.map((a) => ({
    ...a,
    url: addAffiliateTag(a.url),
  }));

  return NextResponse.json({ articles: enriched });
}
