import { NextResponse } from 'next/server';
import { db, yachtModels } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate at most every hour

interface YachtSlug {
  slug: string;
}

async function getAllYachtSlugs(): Promise<string[]> {
  try {
    const result = await db.select({ slug: yachtModels.slug })
      .from(yachtModels)
      .where(sql`${yachtModels.slug} IS NOT NULL`);
    
    return result.map((row: { slug: string }) => row.slug).filter(Boolean) as string[];
  } catch (error) {
    console.error('Error fetching yacht slugs:', error);
    return [];
  }
}

function generateSitemap(urls: Array<{ loc: string; changefreq?: string; priority?: string }>): string {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>
`).join('')}
</urlset>`;

  return sitemap;
}

export async function GET() {
  try {
    // Get all yacht slugs
    const yachtSlugs = await getAllYachtSlugs();
    
    // Define sitemap URLs
    const urls = [
      {
        loc: 'https://sailing-yachts.vercel.app/',
        changefreq: 'daily',
        priority: '1.0'
      },
      {
        loc: 'https://sailing-yachts.vercel.app/yachts',
        changefreq: 'daily',
        priority: '0.9'
      },
      {
        loc: 'https://sailing-yachts.vercel.app/compare',
        changefreq: 'weekly',
        priority: '0.8'
      },
      ...yachtSlugs.map(slug => ({
        loc: `https://sailing-yachts.vercel.app/yachts/${slug}`,
        changefreq: 'monthly',
        priority: '0.7'
      }))
    ];

    // Generate sitemap XML
    const sitemap = generateSitemap(urls);
    
    // Return XML response
    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new NextResponse('Failed to generate sitemap', { status: 500 });
  }
}