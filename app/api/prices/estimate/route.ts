/**
 * P21.4: Price estimation API for public use
 * GET /api/prices/estimate?slug=beneteau-oceanis-40-1
 *
 * Returns estimated price range for a yacht based on specs.
 * Used by yacht detail pages to show price estimates.
 */
import { NextRequest, NextResponse } from 'next/server';
import { estimatePrice } from '@/lib/price-aggregation/estimated-provider';
import { pool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug parameter required' }, { status: 400 });
  }

  try {
    // Fetch yacht specs
    const result = await pool.query(`
      SELECT ym.id, ym.slug, ym.model_name, ym.year, ym.length_overall, ym.displacement,
             m.name as manufacturer_name
      FROM yacht_models ym
      JOIN manufacturers m ON ym.manufacturer_id = m.id
      WHERE ym.slug = $1
    `, [slug]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Yacht not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const candidate = {
      id: row.id,
      slug: row.slug,
      modelName: row.model_name,
      manufacturerName: row.manufacturer_name,
      year: row.year,
      lengthOverall: row.length_overall ? parseFloat(row.length_overall) : null,
      displacement: row.displacement ? parseFloat(row.displacement) : null,
      beam: null,
      cabins: null,
      existingPriceCount: 0,
    };

    const newEstimate = estimatePrice(candidate, 'new');
    const usedEstimate = estimatePrice(candidate, 'used');

    return NextResponse.json({
      slug,
      estimates: {
        new: newEstimate ? {
          priceMin: newEstimate.priceMin,
          priceMax: newEstimate.priceMax,
          currency: newEstimate.currency,
          confidence: newEstimate.confidenceScore,
        } : null,
        used: usedEstimate ? {
          priceMin: usedEstimate.priceMin,
          priceMax: usedEstimate.priceMax,
          currency: usedEstimate.currency,
          confidence: usedEstimate.confidenceScore,
        } : null,
      },
      disclaimer: 'Prices are estimates based on yacht specifications and market data. Actual prices may vary.',
    });
  } catch (error: any) {
    console.error('Error estimating price:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
