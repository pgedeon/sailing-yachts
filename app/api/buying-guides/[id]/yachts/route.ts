import { NextRequest, NextResponse } from "next/server";
import { getTemplateById, templateFiltersToQueryParams } from "@/lib/buying-guides";

/**
 * GET /api/buying-guides/[id]/yachts
 *
 * Returns yachts that match a buying guide template's filters.
 * Used by the BuyingGuideYachtList component to display relevant yachts.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "Buying guide template not found" },
        { status: 404 }
      );
    }

    // Convert template filters to API query params
    const queryParams = templateFiltersToQueryParams(template.filters);

    // Add maxResults limit
    if (template.maxResults) {
      queryParams.limit = template.maxResults.toString();
    }

    // Build the internal API URL
    const searchParams = new URLSearchParams(queryParams);
    const apiUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/yachts?${searchParams.toString()}`;

    // Fetch yachts from the main API
    const response = await fetch(apiUrl, {
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch yachts" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      templateId: id,
      templateName: template.title,
      yachts: data.yachts || [],
      total: data.total || 0,
    });
  } catch (error) {
    console.error("Error fetching buying guide yachts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
