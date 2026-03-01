import { NextResponse } from "next/server";
import { db, yachtModels, manufacturers } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checks: Record<string, boolean | string> = {};

    // Check manufacturers table has rows (table exists)
    const mfgCount = await db.select({ count: manufacturers.id }).from(manufacturers).limit(1);
    checks.manufacturers_table_exists = true;
    checks.manufacturers_has_data = mfgCount.length > 0;

    // Check yacht_models has required columns by querying a single row (empty allowed)
    try {
      const sample = await db
        .select({
          id: yachtModels.id,
          slug: yachtModels.slug,
          updatedAt: yachtModels.updatedAt,
        })
        .from(yachtModels)
        .limit(1);
      checks.yacht_models_columns_accessible = true;
      if (sample.length > 0) {
        checks.slug_present = !!sample[0].slug;
        checks.updated_at_present = !!sample[0].updatedAt;
      } else {
        checks.slug_present = 'no rows to verify';
        checks.updated_at_present = 'no rows to verify';
      }
    } catch (colErr: any) {
      checks.yacht_models_columns_accessible = false;
      checks.schema_error = colErr.message;
    }

    const allPassed = 
      checks.manufacturers_table_exists &&
      checks.yacht_models_columns_accessible &&
      (checks.slug_present === true || checks.slug_present === 'no rows to verify') &&
      (checks.updated_at_present === true || checks.updated_at_present === 'no rows to verify');

    return NextResponse.json({
      status: allPassed ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
