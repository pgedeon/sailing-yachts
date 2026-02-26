import { NextResponse } from "next/server";
import {
  db,
  yachtModels,
  manufacturers,
  specValues,
  specCategories,
} from "@/lib/db";
import { eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const idsParam = searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json(
        {
          error:
            "ids query parameter required (comma-separated yacht model IDs)",
        },
        { status: 400 },
      );
    }
    const ids = idsParam
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "No valid IDs provided" },
        { status: 400 },
      );
    }
    if (ids.length > 3) {
      return NextResponse.json(
        { error: "Maximum 3 yachts allowed for comparison" },
        { status: 400 },
      );
    }

    const yachts = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .where(inArray(yachtModels.id, ids));

    if (yachts.length === 0) {
      return NextResponse.json(
        { error: "No yachts found for provided IDs" },
        { status: 404 },
      );
    }

    const specsData = await db
      .select({
        yachtId: specValues.yachtModelId,
        categoryName: specCategories.name,
        valueText: specValues.valueText,
        valueNumeric: specValues.valueNumeric,
        unit: specCategories.unit,
        isComparable: specCategories.isComparable,
      })
      .from(specValues)
      .leftJoin(
        specCategories,
        eq(specValues.specCategoryId, specCategories.id),
      )
      .where(inArray(specValues.yachtModelId, ids))
      .orderBy(specCategories.displayOrder);

    const specsByYacht: Record<
      number,
      Record<string, { value: number | string; unit?: string | null }>
    > = {};
    for (const s of specsData) {
      if (!s.isComparable) continue;
      if (s.valueNumeric === null && s.valueText === null) continue;
      if (typeof s.yachtId !== "number" || s.yachtId === null) continue;
      if (!s.categoryName) continue;

      const value: number | string =
        s.valueNumeric !== null ? s.valueNumeric : (s.valueText as string);
      if (!specsByYacht[s.yachtId]) specsByYacht[s.yachtId] = {};
      specsByYacht[s.yachtId][s.categoryName] = { value, unit: s.unit };
    }

    const allCategoryNames = new Set<string>();
    for (const yachtId of ids) {
      const yachtSpecs = specsByYacht[yachtId] || {};
      for (const catName of Object.keys(yachtSpecs)) {
        allCategoryNames.add(catName);
      }
    }

    const comparisonTable: Array<{
      category: string;
      unit?: string | null;
      values: Record<number, { value: number | string; hasValue: boolean }>;
    }> = [];
    for (const catName of allCategoryNames) {
      const firstSpec = specsData.find((s) => s.categoryName === catName);
      const row = {
        category: catName,
        unit: firstSpec?.unit ?? undefined,
        values: {} as Record<
          number,
          { value: number | string; hasValue: boolean }
        >,
      };
      for (const yacht of yachts) {
        const spec = specsByYacht[yacht.yacht.id]?.[catName];
        row.values[yacht.yacht.id] = {
          value: spec?.value ?? ("" as any),
          hasValue: !!spec,
        };
      }
      comparisonTable.push(row);
    }

    const simplifiedYachts = yachts.map((y) => ({
      id: y.yacht.id,
      manufacturer: y.manufacturer,
      modelName: y.yacht.modelName,
      year: y.yacht.year,
      slug: y.yacht.slug,
    }));

    return NextResponse.json({
      yachts: simplifiedYachts,
      comparisonTable,
    });
  } catch (error) {
    console.error("Error comparing yachts:", error);
    return NextResponse.json(
      { error: "Failed to compare yachts" },
      { status: 500 },
    );
  }
}
