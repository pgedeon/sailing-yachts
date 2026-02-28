import { NextRequest, NextResponse } from "next/server";
import {
  db,
  yachtModels,
  manufacturers,
  specValues,
  specCategories,
} from "@/lib/db";
import { sql, eq, inArray, and, count, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

function buildNumericCondition(
  query: any,
  categoryName: string,
  table: any,
  valueField: string,
) {
  const min = query[`${categoryName}_min`];
  const max = query[`${categoryName}_max`];
  if (!min && !max) return null;
  const conditions = [];
  if (min) conditions.push(sql`${table}.${valueField} >= ${parseFloat(min)}`);
  if (max) conditions.push(sql`${table}.${valueField} <= ${parseFloat(max)}`);
  return conditions;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filtersRaw = searchParams.get("filters");
    const filters = filtersRaw ? JSON.parse(filtersRaw) : {};

    // DEBUG: Log the incoming filters
    console.log('[DEBUG] /api/yachts filters:', filters);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const sortBy = searchParams.get("sort") || "lengthOverall";
    const sortOrder = searchParams.get("order") || "asc";

    let query: any = db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(
        manufacturers,
        eq(yachtModels.manufacturerId, manufacturers.id),
      );

    if (filters.manufacturers && filters.manufacturers.length > 0) {
      query = query.where(
        inArray(yachtModels.manufacturerId, filters.manufacturers),
      );
    }
    if (filters.rigType && filters.rigType.length > 0) {
      query = query.where(inArray(yachtModels.rigType, filters.rigType));
    }
    if (filters.keelType && filters.keelType.length > 0) {
      query = query.where(inArray(yachtModels.keelType, filters.keelType));
    }
    if (filters.hullMaterial && filters.hullMaterial.length > 0) {
      query = query.where(
        inArray(yachtModels.hullMaterial, filters.hullMaterial),
      );
    }

    const fieldMap: Record<string, any> = {
      lengthOverall: yachtModels.lengthOverall,
      beam: yachtModels.beam,
      draft: yachtModels.draft,
      displacement: yachtModels.displacement,
      sailAreaMain: yachtModels.sailAreaMain,
    };

    const numericCoreFilters: [string, string, string][] = [
      ["lengthOverall", "lengthOverall_min", "lengthOverall_max"],
      ["beam", "beam_min", "beam_max"],
      ["draft", "draft_min", "draft_max"],
      ["displacement", "displacement_min", "displacement_max"],
      ["sailAreaMain", "sailAreaMain_min", "sailAreaMain_max"],
    ];

    for (const [field, minKey, maxKey] of numericCoreFilters) {
      const column = fieldMap[field];
      const min = filters[minKey];
      const max = filters[maxKey];
      if (min !== undefined) {
        query = query.where(gte(column, parseFloat(min as any)));
      }
      if (max !== undefined) {
        query = query.where(lte(column, parseFloat(max as any)));
      }
    }

    if (filters.dynamicNumeric) {
      const entries = Object.entries(filters.dynamicNumeric) as [
        string,
        { min?: number | string; max?: number | string },
      ][];
      for (const [catName, range] of entries) {
        const cat = await db
          .select()
          .from(specCategories)
          .where(eq(specCategories.name, catName))
          .limit(1);
        if (cat.length === 0) continue;
        const category = cat[0];
        if (category.dataType !== "numeric") continue;

        const svAlias = `sv_${category.id}`;
        const aliasedSpec = (specValues as any).as(svAlias);
        const numericCol = sql`${sql.identifier(svAlias)}.value_numeric`;

        query = query.leftJoin(
          aliasedSpec,
          and(
            eq(yachtModels.id, sql`${sql.identifier(svAlias)}.yacht_model_id`),
            eq(sql`${sql.identifier(svAlias)}.spec_category_id`, category.id),
          ),
        );

        const minVal = range?.min;
        const maxVal = range?.max;
        if (minVal !== undefined) {
          query = query.where(gte(numericCol, parseFloat(minVal as any)));
        }
        if (maxVal !== undefined) {
          query = query.where(lte(numericCol, parseFloat(maxVal as any)));
        }
      }
    }

    if (filters.dynamicText) {
      for (const [catName, values] of Object.entries(filters.dynamicText)) {
        if (!Array.isArray(values) || values.length === 0) continue;
        const cat = await db
          .select()
          .from(specCategories)
          .where(eq(specCategories.name, catName))
          .limit(1);
        if (cat.length === 0) continue;
        const category = cat[0];
        if (category.dataType !== "text") continue;

        const svAlias = `svText_${category.id}`;
        const aliasedSpec = (specValues as any).as(svAlias);
        query = query.leftJoin(
          aliasedSpec,
          and(
            eq(yachtModels.id, sql`${sql.identifier(svAlias)}.yacht_model_id`),
            eq(sql`${sql.identifier(svAlias)}.spec_category_id`, category.id),
          ),
        );
        query = query.where(
          inArray(sql`${sql.identifier(svAlias)}.value_text`, values),
        );
      }
    }

    const countResult = await db
      .select({ count: count() })
      .from((query as any).as("count_subquery"));
    const total = Number(countResult[0]?.count || 0);
    // DEBUG: Log the total count from the query
    console.log('[DEBUG] total count from query:', total);

    let sortField: any = yachtModels[sortBy as keyof typeof yachtModels];
    if (!sortField) {
      const cat = await db
        .select()
        .from(specCategories)
        .where(eq(specCategories.name, sortBy))
        .limit(1);
      if (cat.length > 0) {
        const svSortAlias = "sv_sort";
        const aliasedSort = (specValues as any).as(svSortAlias);
        query = query.leftJoin(
          aliasedSort,
          and(
            eq(
              yachtModels.id,
              sql`${sql.identifier(svSortAlias)}.yacht_model_id`,
            ),
            eq(sql`${sql.identifier(svSortAlias)}.spec_category_id`, cat[0].id),
          ),
        );
        sortField = sql`${sql.identifier(svSortAlias)}.value_numeric`;
      }
    }

    if (sortField) {
      query = query.orderBy(sortField, sortOrder === "desc" ? "desc" : "asc");
    } else {
      query = query.orderBy(yachtModels.lengthOverall);
    }

    query = query.limit(limit).offset(offset);

    const results = await query;

    const yachts = await Promise.all(
      results.map(async (r: any) => {
        const specs = await db
          .select({
            category: specCategories.name,
            valueText: specValues.valueText,
            valueNumeric: specValues.valueNumeric,
            unit: specCategories.unit,
          })
          .from(specValues)
          .leftJoin(
            specCategories,
            eq(specValues.specCategoryId, specCategories.id),
          )
          .where(eq(specValues.yachtModelId, r.yacht.id));

        const specsDict: Record<
          string,
          { value: number | string; unit?: string | null }
        > = {};
        for (const s of specs) {
          if (!s.category) continue;
          if (s.valueNumeric !== null) {
            specsDict[s.category] = { value: s.valueNumeric, unit: s.unit };
          } else if (s.valueText !== null) {
            specsDict[s.category] = { value: s.valueText, unit: s.unit };
          }
        }

        return {
          id: r.yacht.id,
          manufacturer: r.manufacturer,
          modelName: r.yacht.modelName,
          year: r.yacht.year,
          slug: r.yacht.slug,
          lengthOverall: r.yacht.lengthOverall,
          beam: r.yacht.beam,
          draft: r.yacht.draft,
          displacement: r.yacht.displacement,
          sailAreaMain: r.yacht.sailAreaMain,
          rigType: r.yacht.rigType,
          keelType: r.yacht.keelType,
          hullMaterial: r.yacht.hullMaterial,
          specs: specsDict,
        };
      }),
    );

    return NextResponse.json({
      yachts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching yachts:", error);
    return NextResponse.json(
      { error: "Failed to fetch yachts" },
      { status: 500 },
    );
  }
}
