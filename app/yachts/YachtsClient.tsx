'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Manufacturer { id: number; name: string; }
interface SpecCategory { id: number; name: string; group?: string; }
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
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<SpecCategory[]>([]);
  const [distinct, setDistinct] = useState<{ rigTypes: string[]; keelTypes: string[]; hullMaterials: string[] }>({ rigTypes: [], keelTypes: [], hullMaterials: [] });
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedYacht, setSelectedYacht] = useState<Yacht | null>(null);

  // Get filter values from URL
  const mfgIds = (searchParams.get('filters[manufacturers]')?.split(',').map(Number).filter(Boolean) ?? []) as number[];
  const rigType = searchParams.get('filters[rigType]') ?? undefined;
  const keelType = searchParams.get('filters[keelType]') ?? undefined;
  const hullMaterial = searchParams.get('filters[hullMaterial]') ?? undefined;

  // Fetch reference data
  useEffect(() => {
    async function loadRefs() {
      try {
        const [m, c] = await Promise.all([
          fetch('/api/manufacturers').then(r => r.json()),
          fetch('/api/spec-categories').then(r => r.json()),
        ]);
        setManufacturers(Array.isArray(m.manufacturers) ? m.manufacturers : []);
        setCategories(Array.isArray(c.categories) ? c.categories : []);
      } catch (e) {
        console.error(e);
      }
    }
    loadRefs();
  }, []);

  // Build query for yachts
  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', '20');
    mfgIds.forEach(id => q.append('filters[manufacturers]', String(id)));
    if (rigType) q.set('filters[rigType]', rigType);
    if (keelType) q.set('filters[keelType]', keelType);
    if (hullMaterial) q.set('filters[hullMaterial]', hullMaterial);
    return q;
  }, [page, mfgIds, rigType, keelType, hullMaterial]);

  // Fetch yachts
  useEffect(() => {
    setLoading(true);
    setError(null);
    const query = buildQuery();
    fetch(`/api/yachts?${query.toString()}`, { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch yachts');
        return r.json();
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

  // Handlers
  const toggleManufacturer = (id: number) => {
    const url = new URLSearchParams(searchParams.toString());
    // Remove existing manufacturers filters
    searchParams.forEach((_, key) => {
      if (key.startsWith('filters[manufacturers]')) url.delete(key);
    });
    const newIds = mfgIds.includes(id) ? mfgIds.filter(x => x !== id) : [...mfgIds, id];
    newIds.forEach(i => url.append('filters[manufacturers]', String(i)));
    window.history.pushState({}, '', `?${url.toString()}`);
    setPage(1);
  };

  const setFilter = (name: string, value: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (value) url.set(`filters[${name}]`, value); else url.delete(`filters[${name}]`);
    window.history.pushState({}, '', `?${url.toString()}`);
    setPage(1);
  };

  const clearFilters = () => {
    const url = new URLSearchParams();
    url.set('page', '1');
    window.history.pushState({}, '', `?${url.toString()}`);
    setPage(1);
  };

  const openYacht = async (slug: string) => {
    const res = await fetch(`/api/yachts/${slug}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      setSelectedYacht(data);
      setModalOpen(true);
    }
  };

  const closeModal = () => { setModalOpen(false); setSelectedYacht(null); };

  if (loading && yachts.length === 0) return <div className="p-8 text-center">Loading yachts...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;

  const format = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');

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
                {manufacturers.length === 0 ? <p className="text-sm text-gray-500">Loading...</p> : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {manufacturers.map(m => (
                      <li key={m.id}>
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="form-checkbox" checked={mfgIds.includes(m.id)} onChange={() => toggleManufacturer(m.id)} />
                          <span className="ml-2 text-sm">{m.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Rig Type</h3>
                {distinct.rigTypes.length === 0 ? <p className="text-sm text-gray-500">No options</p> : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {distinct.rigTypes.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="form-checkbox" checked={rigType === v} onChange={() => setFilter('rigType', rigType === v ? null : v)} />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Keel Type</h3>
                {distinct.keelTypes.length === 0 ? <p className="text-sm text-gray-500">No options</p> : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {distinct.keelTypes.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="form-checkbox" checked={keelType === v} onChange={() => setFilter('keelType', keelType === v ? null : v)} />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">Hull Material</h3>
                {distinct.hullMaterials.length === 0 ? <p className="text-sm text-gray-500">No options</p> : (
                  <ul className="space-y-1 max-h-48 overflow-y-auto">
                    {distinct.hullMaterials.map(v => (
                      <li key={v}>
                        <label className="inline-flex items-center">
                          <input type="checkbox" className="form-checkbox" checked={hullMaterial === v} onChange={() => setFilter('hullMaterial', hullMaterial === v ? null : v)} />
                          <span className="ml-2 text-sm">{v}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button onClick={clearFilters} className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-sm">Clear Filters</button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            {loading && yachts.length === 0 ? (<p>Loading yachts...</p>) : error ? (<p className="text-red-600">{error}</p>) : yachts.length === 0 ? (<p>No yachts match your filters. Try adjusting them.</p>) : (
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
                        <button onClick={() => openYacht(yacht.slug)} className="mt-3 text-blue-600 hover:underline text-sm">
                          View Details
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded disabled:opacity-50">Previous</button>
                    <span>Page {page} of {totalPages} ({total} total)</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded disabled:opacity-50">Next</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}

      {modalOpen && selectedYacht && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-2xl font-bold">{selectedYacht.manufacturer} {selectedYacht.modelName}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
            </div>
            <p className="text-gray-600 mb-4">{selectedYacht.year ?? ''}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Length Overall:</strong> {format(selectedYacht.lengthOverall)} m</div>
              <div><strong>Beam:</strong> {format(selectedYacht.beam)} m</div>
              <div><strong>Draft:</strong> {format(selectedYacht.draft)} m</div>
              <div><strong>Displacement:</strong> {format(selectedYacht.displacement)} kg</div>
              <div><strong>Ballast:</strong> {format(selectedYacht.ballast)} kg</div>
              <div><strong>Sail Area Main:</strong> {format(selectedYacht.sailAreaMain)} m²</div>
              <div><strong>Rig Type:</strong> {selectedYacht.rigType ?? '—'}</div>
              <div><strong>Keel Type:</strong> {selectedYacht.keelType ?? '—'}</div>
              <div><strong>Hull Material:</strong> {selectedYacht.hullMaterial ?? '—'}</div>
              <div><strong>Cabins:</strong> {format(selectedYacht.cabins)}</div>
              <div><strong>Berths:</strong> {format(selectedYacht.berths)}</div>
              <div><strong>Heads:</strong> {format(selectedYacht.heads)}</div>
              <div><strong>Max Occupancy:</strong> {format(selectedYacht.maxOccupancy)}</div>
              <div><strong>Engine HP:</strong> {format(selectedYacht.engineHp)}</div>
              <div><strong>Engine Type:</strong> {selectedYacht.engineType ?? '—'}</div>
              <div><strong>Fuel Capacity:</strong> {format(selectedYacht.fuelCapacity)} L</div>
              <div><strong>Water Capacity:</strong> {format(selectedYacht.waterCapacity)} L</div>
            </div>
            {selectedYacht.description && (
              <div className="mt-4">
                <h3 className="font-semibold">Description</h3>
                <p className="text-gray-700">{selectedYacht.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
