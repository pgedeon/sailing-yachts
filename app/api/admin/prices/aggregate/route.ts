/**
 * P21.4: Admin API for price aggregation
 * GET  — aggregation status
 * POST — trigger aggregation pipeline
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAggregationStatus, runAggregationPipeline } from '@/lib/price-aggregation/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check admin auth
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await getAggregationStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error fetching aggregation status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const options = {
      provider: body.provider as string | undefined,
      dryRun: body.dryRun === true,
      limit: body.limit ? parseInt(body.limit, 10) : 200,
      overwrite: body.overwrite === true,
    };

    const result = await runAggregationPipeline(options);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error running price aggregation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
