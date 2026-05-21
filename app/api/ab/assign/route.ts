import { NextRequest, NextResponse } from "next/server";
import { assignVariant, EXPERIMENTS, type ExperimentId } from "@/lib/ab-testing";

/**
 * GET /api/ab/assign?uid=<userId>&experiment=<experimentId>
 *
 * Returns the variant assignment for a given user and experiment.
 * If no experiment is specified, returns all assignments.
 */
export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json(
      { error: "Missing uid parameter" },
      { status: 400 },
    );
  }

  const experimentParam = request.nextUrl.searchParams.get("experiment");

  if (experimentParam) {
    const experimentId = experimentParam as ExperimentId;
    if (!EXPERIMENTS[experimentId]) {
      return NextResponse.json(
        { error: `Unknown experiment: ${experimentParam}` },
        { status: 404 },
      );
    }
    const variant = assignVariant(experimentId, uid);
    return NextResponse.json({
      experiment: experimentId,
      variant: variant.id,
      variantName: variant.name,
    });
  }

  // Return all active experiment assignments
  const assignments: Record<string, { variant: string; variantName: string }> = {};
  for (const id of Object.keys(EXPERIMENTS) as ExperimentId[]) {
    const variant = assignVariant(id, uid);
    assignments[id] = {
      variant: variant.id,
      variantName: variant.name,
    };
  }

  return NextResponse.json({ uid, assignments });
}
