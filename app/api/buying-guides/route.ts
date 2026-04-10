import { NextRequest, NextResponse } from "next/server";
import {
  getAllTemplates,
  getTemplateById,
  templateFiltersToQueryParams,
} from "@/lib/buying-guides";

export const dynamic = "force-dynamic";

/**
 * GET /api/buying-guides
 * Get all buying guide templates
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("template");

    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ template });
    }

    const templates = getAllTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching buying guide templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch buying guide templates" },
      { status: 500 }
    );
  }
}
