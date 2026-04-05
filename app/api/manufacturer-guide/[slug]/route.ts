import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/api-response";
import { getManufacturerBySlug, getYachtsByManufacturerId } from "@/lib/manufacturers";

export const dynamic = "force-dynamic";

interface ManufacturerGuide {
  manufacturer: {
    id: number;
    name: string;
    slug: string;
    country: string | null;
    foundedYear: number | null;
    description: string | null;
    websiteUrl: string | null;
    logoUrl: string | null;
    yachtCount: number;
    canonicalUrl: string;
    affiliateLink: string;
  };
  fleetStats: {
    yachtCount: number;
    lengthRange: { min: number; max: number } | null;
    displacementRange: { min: number; max: number } | null;
    cabinRange: { min: number; max: number } | null;
    rigTypes: string[];
    hullMaterials: string[];
    yearRange: { min: number; max: number } | null;
  };
  topModels: Array<{
    id: number;
    slug: string;
    modelName: string;
    year: number;
    lengthOverall: number | null;
    beam: number | null;
    draft: number | null;
    displacement: number | null;
    rigType: string | null;
    hullMaterial: string | null;
    cabins: number | null;
    berths: number | null;
    description: string | null;
    primaryImage: string | null;
    completenessScore: number;
  }>;
  highlights: {
    mostSpacious: string | null;
    mostCompact: string | null;
    heaviest: string | null;
    lightest: string | null;
    newest: string | null;
    oldest: string | null;
  };
  sailboatCategories: {
    cruisers: { count: number; percentage: number };
    racers: { count: number; percentage: number };
    bluewater: { count: number; percentage: number };
    multihull: { count: number; percentage: number };
  };
}

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
    
    // Get base URL from environment or default
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://sailing-yachts.vercel.app';

    const affiliateLink = `${baseUrl}/manufacturers/${manufacturer.slug}?tag=pgedeon-20`;

    const guideData: ManufacturerGuide = {
      manufacturer: {
        ...manufacturer,
        canonicalUrl: `${baseUrl}/manufacturers/${manufacturer.slug}`,
        affiliateLink,
      },
      fleetStats: {
        yachtCount: validYachts.length,
        lengthRange: null,
        displacementRange: null,
        cabinRange: null,
        rigTypes: [],
        hullMaterials: [],
        yearRange: null,
      },
      topModels: validYachts.slice(0, 6).map(yacht => ({
        id: yacht.id,
        slug: yacht.slug!,
        modelName: yacht.modelName,
        year: yacht.year,
        lengthOverall: yacht.lengthOverall,
        beam: yacht.beam,
        draft: yacht.draft,
        displacement: yacht.displacement,
        rigType: yacht.rigType,
        hullMaterial: yacht.hullMaterial,
        cabins: yacht.cabins,
        berths: yacht.berths,
        description: yacht.description,
        primaryImage: yacht.primaryImage,
        completenessScore: 0, // Simplified for now
      })),
      highlights: {
        mostSpacious: null,
        mostCompact: null,
        heaviest: null,
        lightest: null,
        newest: validYachts.length > 0 ? validYachts.reduce((max, y) => (y.year || 0) > (max.year || 0) ? y : max).modelName : null,
        oldest: validYachts.length > 0 ? validYachts.reduce((min, y) => (y.year || 9999) < (min.year || 9999) ? y : min).modelName : null,
      },
      sailboatCategories: {
        cruisers: { count: 0, percentage: 0 },
        racers: { count: 0, percentage: 0 },
        bluewater: { count: 0, percentage: 0 },
        multihull: { count: 0, percentage: 0 },
      },
    };

    return NextResponse.json(
      { data: guideData },
      { 
        status: 200,
        headers: {
          ...corsHeaders(),
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching manufacturer guide data:", error);
    return NextResponse.json(
      { error: "Failed to fetch manufacturer guide" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}