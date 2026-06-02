import { requireAdmin } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic';

import { pool } from '@/lib/db';
import AggregationDashboard from './AggregationDashboard';

export const metadata = { title: 'Price Aggregation — Admin' };

async function getStatus() {
  const [totalYachts, yachtsWithPrices, byCondition, byCurrency, bySource] = await Promise.all([
    pool.query(`SELECT COUNT(*) as count FROM yacht_models WHERE length_overall IS NOT NULL`),
    pool.query(`
      SELECT COUNT(DISTINCT yp.yacht_model_id) as count
      FROM yacht_prices yp
      JOIN yacht_models ym ON yp.yacht_model_id = ym.id
      WHERE yp.is_active = true
    `),
    pool.query(`
      SELECT condition, COUNT(*) as count FROM yacht_prices WHERE is_active = true GROUP BY condition
    `),
    pool.query(`
      SELECT currency, COUNT(*) as count FROM yacht_prices WHERE is_active = true GROUP BY currency
    `),
    pool.query(`
      SELECT source, COUNT(*) as count, MIN(price_min) as min_price, MAX(price_max) as max_price
      FROM yacht_prices WHERE is_active = true GROUP BY source ORDER BY count DESC
    `),
  ]);

  const total = parseInt(totalYachts.rows[0]?.count || '0', 10);
  const withPrices = parseInt(yachtsWithPrices.rows[0]?.count || '0', 10);

  return {
    totalYachts: total,
    yachtsWithPrices: withPrices,
    yachtsWithoutPrices: total - withPrices,
    coveragePercent: total > 0 ? Math.round((withPrices / total) * 100) : 0,
    byCondition: Object.fromEntries(byCondition.rows.map((r: any) => [r.condition, parseInt(r.count, 10)])),
    byCurrency: Object.fromEntries(byCurrency.rows.map((r: any) => [r.currency, parseInt(r.count, 10)])),
    bySource: bySource.rows.map((r: any) => ({
      source: r.source,
      count: parseInt(r.count, 10),
      minPrice: r.min_price ? parseFloat(r.min_price) : null,
      maxPrice: r.max_price ? parseFloat(r.max_price) : null,
    })),
  };
}

async function getCandidatesWithoutPrices() {
  const result = await pool.query(`
    SELECT ym.id, ym.slug, ym.model_name, ym.year, ym.length_overall, m.name as manufacturer_name
    FROM yacht_models ym
    JOIN manufacturers m ON ym.manufacturer_id = m.id
    LEFT JOIN yacht_prices yp ON yp.yacht_model_id = ym.id AND yp.is_active = true
    WHERE yp.id IS NULL AND ym.length_overall IS NOT NULL AND ym.year IS NOT NULL
    ORDER BY ym.length_overall DESC
    LIMIT 20
  `);
  return result.rows;
}

export default async function AdminPriceAggregationPage() {
  await requireAdmin()
  const [status, candidates] = await Promise.all([getStatus(), getCandidatesWithoutPrices()]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Price Aggregation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Aggregate and estimate price data for yachts based on specifications
        </p>
      </div>

      {/* Coverage Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Yachts</div>
          <div className="text-2xl font-bold text-gray-900">{status.totalYachts}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">With Prices</div>
          <div className="text-2xl font-bold text-green-600">{status.yachtsWithPrices}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Missing Prices</div>
          <div className="text-2xl font-bold text-red-600">{status.yachtsWithoutPrices}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Coverage</div>
          <div className="text-2xl font-bold text-blue-600">{status.coveragePercent}%</div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2 transition-all"
              style={{ width: `${status.coveragePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Condition Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {Object.entries(status.byCondition).map(([condition, count]) => (
          <div key={condition} className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-500 capitalize">{condition} Prices</div>
            <div className="text-xl font-bold text-gray-900">{count as number}</div>
          </div>
        ))}
      </div>

      {/* Source Breakdown */}
      {status.bySource.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-medium text-gray-700">Price Sources</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {status.bySource.map((s: any) => (
                <tr key={s.source} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{s.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{s.count}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {s.minPrice && s.maxPrice
                      ? `€${Math.round(s.minPrice / 1000)}K – €${Math.round(s.maxPrice / 1000)}K`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Aggregation Actions */}
      <AggregationDashboard candidatesWithoutPrices={candidates.length} />

      {/* Candidates Without Prices */}
      {candidates.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="text-sm font-medium text-gray-700">
              Yachts Missing Prices (Top 20 by Length)
            </h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yacht</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">LOA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {candidates.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{c.model_name}</div>
                    <div className="text-gray-500 text-xs">{c.manufacturer_name}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.year}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{c.length_overall}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <a href="/admin/prices" className="text-sm text-blue-600 hover:text-blue-800">← Price Management</a>
        <a href="/admin" className="text-sm text-blue-600 hover:text-blue-800">← Admin Dashboard</a>
      </div>
    </div>
  );
}
