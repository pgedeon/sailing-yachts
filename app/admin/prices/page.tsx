import { requireAdmin } from '@/lib/admin-auth'
export const dynamic = 'force-dynamic';

import { pool } from "@/lib/db";
import Link from "next/link";

export const metadata = { title: "Price Management — Admin" };

async function getPrices(limit = 100) {
  const result = await pool.query(
    `SELECT yp.*, ym.model_name, m.name as manufacturer_name
     FROM yacht_prices yp
     JOIN yacht_models ym ON yp.yacht_model_id = ym.id
     LEFT JOIN manufacturers m ON ym.manufacturer_id = m.id
     ORDER BY yp.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function getStats() {
  const total = await pool.query(`SELECT COUNT(*) as count FROM yacht_prices`);
  const active = await pool.query(`SELECT COUNT(*) as count FROM yacht_prices WHERE is_active = TRUE`);
  const yachts = await pool.query(`SELECT COUNT(DISTINCT yacht_model_id) as count FROM yacht_prices`);
  return {
    total: parseInt(total.rows[0]?.count || "0", 10),
    active: parseInt(active.rows[0]?.count || "0", 10),
    yachts: parseInt(yachts.rows[0]?.count || "0", 10),
  };
}

function ConfidenceBadge({ score }: { score: number }) {
  const cls = score >= 70
    ? "bg-green-100 text-green-800"
    : score >= 40
    ? "bg-yellow-100 text-yellow-800"
    : "bg-red-100 text-red-800";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{score}%</span>;
}

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">Active</span>
    : <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">Inactive</span>;
}

function formatPrice(amount: number | string, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount));
}

export default async function AdminPricesPage() {
  await requireAdmin()
  const [prices, stats] = await Promise.all([getPrices(), getStats()]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} records · {stats.active} active · {stats.yachts} yachts with pricing
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/prices/aggregate"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            🔄 Aggregation
          </a>
          <a
            href="/admin/prices/import"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            📄 CSV Import
          </a>
          <button
            id="add-price-btn"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
data-action="add-price"
          >
            ➕ Add Price
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Total Records</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Active Prices</div>
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-500">Yachts Priced</div>
          <div className="text-2xl font-bold text-blue-600">{stats.yachts}</div>
        </div>
      </div>

      {/* Price Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Yacht</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price Range</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effective</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No price records yet. Add prices manually or import via CSV.
                </td>
              </tr>
            )}
            {prices.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-gray-900">{p.model_name}</div>
                  <div className="text-gray-500 text-xs">{p.manufacturer_name}</div>
                </td>
                <td className="px-4 py-3 text-sm capitalize text-gray-700">{p.condition}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatPrice(p.price_min, p.currency || 'USD')} – {formatPrice(p.price_max, p.currency || 'USD')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="text-gray-900">{p.source}</div>
                  <div className="text-gray-500 text-xs">{p.source_type}</div>
                </td>
                <td className="px-4 py-3 text-sm"><ConfidenceBadge score={p.confidence_score} /></td>
                <td className="px-4 py-3 text-sm"><StatusBadge active={p.is_active} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {p.effective_date ? new Date(p.effective_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                      data-action="toggle"
                      data-id={p.id}
                      data-active={p.is_active ? 'false' : 'true'}
                    >
                      {p.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 text-xs font-medium"
                      data-action="delete"
                      data-id={p.id}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Price Modal */}
      <div id="add-price-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
          <h2 className="text-lg font-bold mb-4">Add Price Record</h2>
          <form id="add-price-form" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yacht Model ID *</label>
              <input type="number" name="yachtModelId" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. 1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Min *</label>
                <input type="number" name="priceMin" required step="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="150000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Max *</label>
                <input type="number" name="priceMax" required step="0.01" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="200000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select name="currency" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select name="condition" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="broker">Broker</option>
                  <option value="charter">Charter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                <input type="number" name="confidenceScore" min="0" max="100" defaultValue="50" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source *</label>
              <input type="text" name="source" required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="e.g. Manufacturer website" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
                <select name="sourceType" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                  <option value="manual">Manual Entry</option>
                  <option value="csv_import">CSV Import</option>
                  <option value="api_feed">API Feed</option>
                  <option value="partner">Partner</option>
                  <option value="scraper">Scraper</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" name="year" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="2026" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
              <input type="url" name="sourceUrl" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea name="notes" rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="Optional notes..." />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
data-action="cancel-price"
              >
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                Create Price Record
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Client-side interactivity */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function() {
          // Add price button
          var addBtn = document.getElementById('add-price-btn');
          if (addBtn) addBtn.addEventListener('click', function() {
            var modal = document.getElementById('add-price-modal');
            if (modal) modal.classList.remove('hidden');
          });
          // Cancel button
          var cancelBtn = document.querySelector('[data-action="cancel-price"]');
          if (cancelBtn) cancelBtn.addEventListener('click', function() {
            var modal = document.getElementById('add-price-modal');
            if (modal) modal.classList.add('hidden');
          });
          // Toggle active status
          document.querySelectorAll('[data-action="toggle"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var id = this.dataset.id;
              var active = this.dataset.active === 'true';
              fetch('/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id: parseInt(id), isActive: active })
              }).then(function() { window.location.reload(); });
            });
          });

          // Delete
          document.querySelectorAll('[data-action="delete"]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              if (!confirm('Delete this price record?')) return;
              var id = this.dataset.id;
              fetch('/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id: parseInt(id) })
              }).then(function() { window.location.reload(); });
            });
          });

          // Add price form
          var form = document.getElementById('add-price-form');
          if (form) {
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              var fd = new FormData(form);
              var data = {
                action: 'create',
                yachtModelId: parseInt(fd.get('yachtModelId')),
                priceMin: parseFloat(fd.get('priceMin')),
                priceMax: parseFloat(fd.get('priceMax')),
                currency: fd.get('currency'),
                condition: fd.get('condition'),
                confidenceScore: parseInt(fd.get('confidenceScore')),
                source: fd.get('source'),
                sourceType: fd.get('sourceType'),
                year: fd.get('year') ? parseInt(fd.get('year')) : undefined,
                sourceUrl: fd.get('sourceUrl') || undefined,
                notes: fd.get('notes') || undefined,
              };
              fetch('/api/prices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              }).then(function(r) {
                if (r.ok) window.location.reload();
                else return r.json().then(function(j) { alert('Error: ' + (j.error || 'Unknown')); });
              });
            });
          }
        });
      `}} />

      <div className="mt-4">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">← Back to Admin</Link>
      </div>
    </div>
  );
}
