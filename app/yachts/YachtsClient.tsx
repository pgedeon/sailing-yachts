'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Manufacturer {
  id: number;
  name: string;
}

interface SpecCategory {
  id: number;
  name: string;
  group?: string;
}

interface Yacht {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  slug: string | null;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  ballast: number | null;
  sailAreaMain: number | null;
  rigType: string | null;
  keelType: string | null;
  hullMaterial: string | null;
  cabins: number | null;
  berths: number | null;
  heads: number | null;
  maxOccupancy: number | null;
  engineHp: number | null;
  engineType: string | null;
  fuelCapacity: number | null;
  waterCapacity: number | null;
}

export default function YachtsClient() {
  const searchParams = useSearchParams();

  // State
  const [categories, setCategories] = useState<SpecCategory[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [distinct, setDistinct] = useState<{ rigTypes: string[]; keelTypes: string[]; hullMaterials: string[] }>({
    rigTypes: [],
    keelTypes: [],
    hullMaterials: [],
  });
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived filters from URL
  const manufacturersFilter = useMemo(() => {
    const p = searchParams.get('filters[manufacturers]');
    return p ? p.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id)) : [];
  }, [searchParams]);

  const rigTypeFilter = searchParams.get('filters[rigType]') ?? undefined;
  const keelTypeFilter = searchParams.get('filters[keelType]') ?? undefined;
  const hullMaterialFilter = searchParams.get('filters[hullMaterial]') ?? undefined;

  const limit = 20;

  // Build query object for fetches
  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.set('limit', limit.toString());
    q.set('page', page.toString());
    if (manufacturersFilter.length > 0) {
      manufacturersFilter.forEach(id => q.append('filters[manufacturers]', id.toString()));
    }
    if (rigTypeFilter) q.set('filters[rigType]', rigTypeFilter);
    if (keelTypeFilter) q.set('filters[keelType]', keelTypeFilter);
    if (hullMaterialFilter) q.set('filters[hullMaterial]', hullMaterialFilter);
    return q;
  }, [page, manufacturersFilter, rigTypeFilter, keelTypeFilter, hullMaterialFilter]);

  // Fetch manufacturers and categories on mount
  useEffect(() => {
    async function fetchRefs() {
      try {
        const [mfgRes, catRes] = await Promise.all([
          fetch('/api/manufacturers'),
          fetch('/api/spec-categories'),
        ]);
        const [mfgJson, catJson] = await Promise.all([mfgRes.json(), catRes.json()]);
        setManufacturers(Array.isArray(mfgJson.manufacturers) ? mfgJson.manufacturers : []);
        setCategories(Array.isArray(catJson.categories) ? catJson.categories : []);
      } catch (err) {
        console.error('Failed to fetch reference data:', err);
      }
    }
    fetchRefs();
  }, []);

  // Fetch yachts
  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = buildQuery();
    fetch(`/api/yachts?${query.toString()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch yachts');
        return res.json();
      })
      .then(data => {
        setYachts(data.yachts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setDistinct(data.distinct || { rigTypes: [], keelTypes: [], hullMaterials: [] });
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [buildQuery]);

  const toggleManufacturer = (id: number) => {
    const url = new URLSearchParams(searchParams.toString());
    // Remove existing manufacturers filters
    searchParams.forEach((_, key) => {
      if (key.startsWith('filters[manufacturers]')) url.delete(key);
    });
    // Build new list
    const current = manufacturersFilter.slice();
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    current.forEach(i => url.append('filters[manufacturers]', i.toString()));
    window.history.pushState({}, '', `${window.location.pathname}?${url.toString()}`);
    setPage(1);
  };

  const setRigType = (value: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (value) url.set('filters[rigType]', value); else url.delete('filters[rigType]');
    window.history.pushState({}, '', `${window.location.pathname}?${url.toString()}`);
    setPage(1);
  };

  const setKeelType = (value: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (value) url.set('filters[keelType]', value); else url.delete('filters[keelType]');
    window.history.pushState({}, '', `${window.location.pathname}?${url.toString()}`);
    setPage(1);
  };

  const setHullMaterial = (value: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (value) url.set('filters[hullMaterial]', value); else url.delete('filters[hullMaterial]');
    window.history.pushState({}, '', `${window.location.pathname}?${url.toString()}`);
    setPage(1);
  };

  const clearFilters = () => {
    const url = new URLSearchParams();
    url.set('page', '1');
    window.history.pushState({}, '', `${window.location.pathname}?${url.toString()}`);
    setPage(1);
  };

  if (loading && yachts.length === 0) {
    return <div className="p-8 text-center">Loading yachts...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }

  const rigTypeOptions = distinct.rigTypes;
  const keelTypeOptions = distinct.keelTypes;
  const hullMaterialOptions = distinct.hullMaterials;

  // Format helper
  const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Sail Yachts</h1>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded shadow p-4">
              <h2 className="font-semibold mb-4">Filters</h2>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Manufacturer</h3>
                {manufacturers.length === 0 ? (
                  <p className="text-sm text-gray-500">Loading manufacturers...</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {manufacturers.map(m => (
                      <li key={m.id}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={manufacturersFilter.includes(m.id)}
                            onChange={() => toggleManufacturer(m.id)}
                          />
                          <span className="ml-2 text-sm">{m.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Rig Type</h3>
                {rigTypeOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No options</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {rigTypeOptions.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={rigTypeFilter === v}
                            onChange={() => setRigType(rigTypeFilter === v ? null : v)}
                          />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Keel Type</h3>
                {keelTypeOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No options</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {keelTypeOptions.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={keelTypeFilter === v}
                            onChange={() => setKeelType(keelTypeFilter === v ? null : v)}
                          />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Hull Material</h3>
                {hullMaterialOptions.length === 0 ? (
                  <p className="text-sm text-gray-500">No options</p>
                ) : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {hullMaterialOptions.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            className="form-checkbox"
                            checked={hullMaterialFilter === v}
                            onChange={() => setHullMaterial(hullMaterialFilter === v ? null : v)}
                          />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={clearFilters}
                className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Clear Filters
              </button>
            </div>
          </aside>

          {/* Main grid */}
          <main className="flex-1">
            {loading && yachts.length === 0 ? (
              <p>Loading yachts...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : yachts.length === 0 ? (
              <p>No yachts match your filters. Try adjusting them.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {yachts.map(yacht => (
                    <div key={yacht.id} className="border rounded p-4 bg-white shadow-sm">
                      <h3 className="font-bold text-lg">{yacht.manufacturer} {yacht.modelName}</h3>
                      <p className="text-sm text-gray-600">{yacht.year ?? '—'}</p>
                      <dl className="mt-2 text-sm">
                        <div className="flex justify-between"><dt>Length:</dt><dd>{fmt(yacht.lengthOverall)} m</dd></div>
                        <div className="flex justify-between"><dt>Beam:</dt><dd>{fmt(yacht.beam)} m</dd></div>
                        <div className="flex justify-between"><dt>Draft:</dt><dd>{fmt(yacht.draft)} m</dd></div>
                        <div className="flex justify-between"><dt>Displacement:</dt><dd>{fmt(yacht.displacement)} kg</dd></div>
                        <div className="flex justify-between"><dt>Rig:</dt><dd>{yacht.rigType ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt>Keel:</dt><dd>{yacht.keelType ?? '—'}</dd></div>
                        <div className="flex justify-between"><dt>Hull:</dt><dd>{yacht.hullMaterial ?? '—'}</dd></div>
                      </dl>
                      {yacht.slug && (
                        <Link href={`/yachts/${yacht.slug}`} className="inline-block mt-3 text-blue-600 hover:underline text-sm">
                          View Details
                        </Link>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span>
                      Page {page} of {totalPages} ({total} total)
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
