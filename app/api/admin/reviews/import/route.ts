import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { revalidateTag } from 'next/cache';

/**
 * POST /api/admin/reviews/import
 * CSV import: expects JSON array of review objects or CSV text.
 * JSON format: [{ yachtModelId, reviewSourceId?, source?, rating, summary?, ... }]
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let reviews: Array<Record<string, unknown>>;

    if (contentType.includes('text/csv')) {
      const text = await request.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 });
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      reviews = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj: Record<string, unknown> = {};
        headers.forEach((h, i) => { obj[h] = values[i]; });
        return obj;
      });
    } else {
      const body = await request.json();
      reviews = Array.isArray(body) ? body : body.reviews;
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'No reviews provided' }, { status: 400 });
    }

    if (reviews.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 reviews per batch' }, { status: 400 });
    }

    let imported = 0;
    let errors = 0;
    const errorDetails: string[] = [];

    for (let i = 0; i < reviews.length; i++) {
      const r = reviews[i];
      const yachtModelId = Number(r.yachtmodelid || r.yacht_model_id || r.yachtModelId);
      const rating = Number(r.rating);

      if (!yachtModelId || isNaN(rating) || rating < 1 || rating > 5) {
        errors++;
        errorDetails.push(`Row ${i + 1}: invalid yachtModelId or rating`);
        continue;
      }

      try {
        const reviewSourceId = r.reviewsourceid || r.review_source_id || r.reviewSourceId || null;
        const source = (r.source as string) || 'import';
        const summary = (r.summary as string) || null;
        const fullText = (r.fulltext || r.full_text || r.fullText) as string || null;
        const authorName = (r.authorname || r.author_name || r.authorName) as string || null;
        const sourceUrl = (r.sourceurl || r.source_url || r.sourceUrl) as string || null;
        const reviewDate = (r.reviewdate || r.review_date || r.reviewDate) as string || null;
        const reviewType = (r.reviewtype || r.review_type || r.reviewType) as string || 'expert';

        let pros: string[] = [];
        let cons: string[] = [];
        if (r.pros) {
          pros = typeof r.pros === 'string' ? r.pros.split(';').filter(Boolean) : (r.pros as string[]);
        }
        if (r.cons) {
          cons = typeof r.cons === 'string' ? r.cons.split(';').filter(Boolean) : (r.cons as string[]);
        }

        await pool.query(
          `INSERT INTO reviews (
            yacht_model_id, review_source_id, source, rating, summary, full_text,
            author_name, source_url, review_date, review_type, pros, cons, verified
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)`,
          [
            yachtModelId,
            reviewSourceId ? Number(reviewSourceId) : null,
            source,
            String(rating),
            summary,
            fullText,
            authorName,
            sourceUrl,
            reviewDate,
            reviewType,
            pros,
            cons,
          ]
        );
        imported++;
      } catch (e: any) {
        errors++;
        errorDetails.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    revalidateTag('yachts', 'default');

    return NextResponse.json({
      imported,
      errors,
      ...(errorDetails.length > 0 && { errorDetails: errorDetails.slice(0, 20) }),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to import reviews:', error);
    return NextResponse.json({ error: 'Failed to import reviews' }, { status: 500 });
  }
}
