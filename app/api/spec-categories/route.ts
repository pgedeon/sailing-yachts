import { NextResponse } from "next/server";
import { db, specCategories as categoriesTable } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db
      .select()
      .from(categoriesTable)
      .orderBy(categoriesTable.displayOrder);

    // Transform to clean API format
    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      unit: cat.unit,
      dataType: cat.dataType,
      categoryGroup: cat.categoryGroup,
      displayOrder: cat.displayOrder,
      isFilterable: cat.isFilterable,
      isSortable: cat.isSortable,
      isComparable: cat.isComparable,
      description: cat.description,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching spec categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch spec categories" },
      { status: 500 },
    );
  }
}
