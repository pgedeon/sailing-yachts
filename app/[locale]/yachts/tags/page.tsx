import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { getSiteUrl, buildLocaleAlternates } from '@/lib/seo';
import { USE_CASE_TAG_IDS, USE_CASE_TAG_META, assignUseCaseTags, type UseCaseTagId } from '@/lib/use-case-tags';
import { UseCaseBadge } from '@/components/use-case-badge';
import { pool } from '@/lib/db';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Yachts' });

  return {
    title: t('useCaseTagsPage.meta.title'),
    description: t('useCaseTagsPage.meta.description'),
    alternates: buildLocaleAlternates('/yachts/tags'),
  };
}

export default async function UseCaseTagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Yachts' });

  // Count yachts per tag for stats
  const result = await pool.query(
    `SELECT id, length_overall, beam, draft, displacement, ballast, sail_area_main, rig_type, keel_type, cabins, berths FROM yacht_models`
  );

  const tagCounts: Record<string, number> = {};
  for (const tagId of USE_CASE_TAG_IDS) {
    tagCounts[tagId] = 0;
  }
  for (const row of result.rows) {
    const tags = assignUseCaseTags({
      lengthOverall: row.length_overall ?? null,
      beam: row.beam ?? null,
      draft: row.draft ?? null,
      displacement: row.displacement ?? null,
      ballast: row.ballast ?? null,
      sailAreaMain: row.sail_area_main ?? null,
      cabins: row.cabins ?? null,
      berths: row.berths ?? null,
      rigType: row.rig_type ?? null,
      keelType: row.keel_type ?? null,
    });
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }

  const totalYachts = result.rows.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{t('useCaseTagsPage.heading')}</h1>
        <p className="text-gray-600 text-lg mb-8">{t('useCaseTagsPage.intro')}</p>

        <div className="space-y-8">
          {USE_CASE_TAG_IDS.map(tagId => {
            const meta = USE_CASE_TAG_META[tagId];
            const count = tagCounts[tagId] || 0;
            return (
              <div key={tagId} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-3">
                  <UseCaseBadge tagId={tagId} size="md" />
                  <span className="text-sm text-gray-500">
                    {t('useCaseTagsPage.yachtCount', { count })}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-2">{t(`useCaseTags.${tagId}.label`)}</h2>
                <p className="text-gray-700 leading-relaxed">{t(`useCaseTags.${tagId}.description`)}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('useCaseTagsPage.criteria')}
                  </h3>
                  <p className="text-sm text-gray-600">{t(`useCaseTags.${tagId}.criteria`)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-4">
            {t('useCaseTagsPage.disclaimer', { total: totalYachts })}
          </p>
          <a
            href="/yachts"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            {t('useCaseTagsPage.browseAll')}
          </a>
        </div>
      </div>
    </div>
  );
}
