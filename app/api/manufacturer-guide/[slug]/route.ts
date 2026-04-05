import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/api-response";
import { getManufacturerBySlug, getYachtsByManufacturerId } from "@/lib/manufacturers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const manufacturer = await getManufacturerBySlug(slug);

    if (!manufacturer) {
      return NextResponse.json(
        { error: "Manufacturer not found" },
        { status: 404 }
      );
    }

    const yachts = await getYachtsByManufacturerId(manufacturer.id);
    const validYachts = yachts.filter(y => y.slug !== null);
    
    // Simple response for now
    return NextResponse.json({
      manufacturer,
      yachtCount: validYachts.length,
      topModels: validYachts.slice(0, 3)
    });
  } catch (error) {
    console.error("Error fetching manufacturer:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturer" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}