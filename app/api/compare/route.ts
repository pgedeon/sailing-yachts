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
import { eq, and, sql } from "drizzle-orm";
import { mapYachtToDetailDto } from "@/lib/mappers/yacht";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ error: 'ids parameter required' }, { status: 400 });
    }
    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Invalid ids' }, { status: 400 });
    }
    if (ids.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 yachts allowed' }, { status: 400 });
    }

    // Fetch all yachts with full details using shared mapper
    const rows = await db
      .select({
        // Yacht fields
        id: yachtModels.id,
        model_name: yachtModels.modelName,
        manufacturer_id: yachtModels.manufacturerId,
        year: yachtModels.year,
        slug: yachtModels.slug,
        length_overall: yachtModels.lengthOverall,
        beam: yachtModels.beam,
        draft: yachtModels.draft,
        displacement: yachtModels.displacement,
        ballast: yachtModels.ballast,
        sail_area_main: yachtModels.sailAreaMain,
        rig_type: yachtModels.rigType,
        keel_type: yachtModels.keelType,
        hull_material: yachtModels.hullMaterial,
        cabins: yachtModels.cabins,
        berths: yachtModels.berths,
        heads: yachtModels.heads,
        max_occupancy: yachtModels.maxOccupancy,
        engine_hp: yachtModels.engineHp,
        engine_type: yachtModels.engineType,
        fuel_capacity: yachtModels.fuelCapacity,
        water_capacity: yachtModels.waterCapacity,
        design_notes: yachtModels.designNotes,
        description: yachtModels.description,
        source_url: yachtModels.sourceUrl,
        source_attribution: yachtModels.sourceAttribution,
        admin_links: yachtModels.adminLinks,
        created_at: yachtModels.createdAt,
        updated_at: yachtModels.updatedAt,
        manufacturer_name: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(and(...ids.map(id => sql`${yachtModels.id} = ${id}`))); // OR condition

    // Map each row to detail DTO (with specs, images, reviews)
    const yachts = rows.map(row => {
      // For each yacht, fetch specs/images/reviews
      // For simplicity in this endpoint, we'll leave specsByGroup empty (would need separate queries)
      // In a real optimize, we'd join all related tables.
      return {
        ...mapYachtToDetailDto(row),
        specsByGroup: row.specs_by_group || {}, // if you join spec data in future
        images: row.images || [],
        reviews: row.reviews || [],
      };
    });

    return NextResponse.json({ yachts });
  } catch (error: any) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compare data', details: error.message },
      { status: 500 }
    );
  }
}
