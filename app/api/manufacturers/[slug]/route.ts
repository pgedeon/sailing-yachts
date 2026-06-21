import { NextResponse } from "next/server";

import {
  getManufacturerBySlug,
  getYachtsByManufacturerId,
} from "@/lib/manufacturers";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  try {
    const { slug } = params;
    const manufacturer = await getManufacturerBySlug(slug);

    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 404 },
      );
    }

    const yachts = await getYachtsByManufacturerId(manufacturer.id);

    return NextResponse.json({ manufacturer, yachts });
  } catch (error) {
    console.error("Error fetching manufacturer by slug:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturer" },
      { status: 500 },
    );
  }
}
