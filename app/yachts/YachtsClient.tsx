'use client';

import { FavoriteButton } from '@/app/components/FavoriteButton';
import { PriceTierBadge } from '@/app/components/PriceTierBadge';
import { calculatePriceTier } from '@/lib/price-tier';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

interface Manufacturer { id: number; name: string; }

function fmt(value: number | null): string {
  return value?.toLocaleString() || "—";
}
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
  description: string | null;
}

// Serialize filters to a string key for stable comparison
function filterKey(mfgIds: number[], rigType?: string, keelType?: string, hullMaterial?: string): string {
  return `${mfgIds.sort().join(',')}:${rigType ?? ''}:${keelType ?? ''}:${hullMaterial ?? ''}`;
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Parse filters from URL once on mount and when URL actually changes
  const mfgIds = searchParams.getAll('filters[manufacturers]').map(Number).filter(Boolean);
  const rigType = searchParams.get('filters[rigType]') ?? undefined;
  const keelType = searchParams.get('filters[keelType]') ?? undefined;
  const hullMaterial = searchParams.get('filters[hullMaterial]') ?? undefined;

  // Active filter count for badge
  const activeFilterCount = mfgIds.length + (rigType ? 1 : 0) + (keelType ? 1 : 0) + (hullMaterial ? 1 : 0);

  // Stable filter key to prevent re-fetching on same params
  const currentKey = filterKey(mfgIds, rigType, keelType, hullMaterial);
  const lastFetchedKey = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  // Fetch reference data (once)
  useEffect(() => {
    let cancelled = false;
    async function loadRefs() {
      try {
        const [m, c] = await Promise.all([
          fetch('/api/manufacturers').then(r => r.json()),
          fetch('/api/spec-categories').then(r => r.json()),
        ]);
        if (!cancelled) {
          setManufacturers(Array.isArray(m.manufacturers) ? m.manufacturers : []);
          setCategories(Array.isArray(c.categories) ? c.categories : []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadRefs();
    return () => { cancelled = true; };
  }, []);

  // Fetch yachts - only when key actually changes
  useEffect(() => {
    const fetchKey = `${currentKey}:p${page}`;
    if (fetchKey === lastFetchedKey.current) return;
    lastFetchedKey.current = fetchKey;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const q = new URLSearchParams();
    q.set('page', String(page));
    q.set('limit', '20');
    mfgIds.forEach(id => q.append('filters[manufacturers]', String(id)));
    if (rigType) q.set('filters[rigType]', rigType);
    if (keelType) q.set('filters[keelType]', keelType);
    if (hullMaterial) q.set('filters[hullMaterial]', hullMaterial);

    fetch(`/api/yachts?${q.toString()}`, { cache: 'no-store', signal: controller.signal })
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
        if (err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [currentKey, page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  const toggleManufacturer = (id: number) => {
    const url = new URLSearchParams(searchParams.toString());
    searchParams.forEach((_, key) => {
      if (key.startsWith('filters[manufacturers]')) url.delete(key);
    });
    const newIds = mfgIds.includes(id) ? mfgIds.filter(x => x !== id) : [...mfgIds, id];
    newIds.forEach(i => url.append('filters[manufacturers]', String(i)));
    window.history.pushState({}, '', `?${url.toString()}`);
    setPage(1);
    lastFetchedKey.current = '';
  };

  const setFilter = (name: string, value: string | null) => {
    const url = new URLSearchParams(searchParams.toString());
    if (value) url.set(`filters[${name}]`, value); else url.delete(`filters[${name}]`);
    window.history.pushState({}, '', `?${url.toString()}`);
    setPage(1);
    lastFetchedKey.current = '';
  };

  const clearFilters = () => {
    window.history.pushState({}, '', '?page=1');
    setPage(1);
    lastFetchedKey.current = '';
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

  const FilterSidebar = () => (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Filters</h2>
        {activeFilterCount > 0 && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
            {activeFilterCount} active
          </span>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Manufacturer</h3>
        {manufacturers.length === 0 ? <p className="text-sm text-gray-500">Loading...</p> : (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {manufacturers.map(m => (
              <li key={m.id}>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="form-checkbox rounded" checked={mfgIds.includes(m.id)} onChange={() => toggleManufacturer(m.id)} />
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
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="form-checkbox rounded" checked={rigType === v} onChange={() => setFilter('rigType', rigType === v ? null : v)} />
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
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="form-checkbox rounded" checked={keelType === v} onChange={() => setFilter('keelType', keelType === v ? null : v)} />
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
                <label className="inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="form-checkbox rounded" checked={hullMaterial === v} onChange={() => setFilter('hullMaterial', hullMaterial === v ? null : v)} />
                  <span className="ml-2 text-sm">{v}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button onClick={clearFilters} className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded text-sm transition-colors">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header with mobile filter toggle */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Sail Yachts</h1>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="md:hidden inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-600 text-white font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar — always visible on md+, toggleable on mobile */}
          <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0`}>
            <FilterSidebar />
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">
            {loading && yachts.length === 0 ? (<p>Loading yachts...</p>) : error ? (<p className="text-red-600">{error}</p>) : yachts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-2">No yachts match your filters.</p>
                <button onClick={clearFilters} className="text-blue-600 hover:underline text-sm">Clear all filters</button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {yachts.map(yacht => (
                    <div key={yacht.id} className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg leading-tight">{yacht.manufacturer} {yacht.modelName}</h3>
                        {yacht.slug && <FavoriteButton slug={yacht.slug} modelName={`${yacht.manufacturer} ${yacht.modelName}`} size="sm" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-gray-600">{yacht.year ?? '—'}</p>
                        <PriceTierBadge info={calculatePriceTier({
                          lengthOverall: yacht.lengthOverall,
                          displacement: yacht.displacement,
                          beam: yacht.beam,
                          cabins: yacht.cabins,
                          hullMaterial: yacht.hullMaterial,
                          keelType: yacht.keelType,
                          rigType: yacht.rigType,
                        })} />
                      </div>
                      <dl className="mt-3 text-sm">
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Length:</dt><dd className="font-medium">{fmt(yacht.lengthOverall)} m</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Beam:</dt><dd className="font-medium">{fmt(yacht.beam)} m</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Draft:</dt><dd className="font-medium">{fmt(yacht.draft)} m</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Displacement:</dt><dd className="font-medium">{fmt(yacht.displacement)} kg</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Rig:</dt><dd className="font-medium">{yacht.rigType ?? '—'}</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Keel:</dt><dd className="font-medium">{yacht.keelType ?? '—'}</dd></div>
                        <div className="flex justify-between py-0.5"><dt className="text-gray-500">Hull:</dt><dd className="font-medium">{yacht.hullMaterial ?? '—'}</dd></div>
                      </dl>
                      {yacht.slug && (
                        <button onClick={() => openYacht(yacht.slug!)} className="mt-3 text-blue-600 hover:underline text-sm font-medium">
                          View Details →
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between text-sm">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">Previous</button>
                    <span className="text-gray-600">Page {page} of {totalPages} <span className="text-gray-400">({total} total)</span></span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors">Next</button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && selectedYacht && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-lg p-5 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl sm:text-2xl font-bold pr-4">{selectedYacht.manufacturer} {selectedYacht.modelName}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 text-2xl leading-none flex-shrink-0">&times;</button>
            </div>
            <p className="text-gray-600 mb-4">{selectedYacht.year ?? ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Length Overall:</span> <span className="font-medium">{format(selectedYacht.lengthOverall)} m</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Beam:</span> <span className="font-medium">{format(selectedYacht.beam)} m</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Draft:</span> <span className="font-medium">{format(selectedYacht.draft)} m</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Displacement:</span> <span className="font-medium">{format(selectedYacht.displacement)} kg</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Ballast:</span> <span className="font-medium">{format(selectedYacht.ballast)} kg</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Sail Area:</span> <span className="font-medium">{format(selectedYacht.sailAreaMain)} m²</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Rig Type:</span> <span className="font-medium">{selectedYacht.rigType ?? '—'}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Keel Type:</span> <span className="font-medium">{selectedYacht.keelType ?? '—'}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Hull:</span> <span className="font-medium">{selectedYacht.hullMaterial ?? '—'}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Cabins:</span> <span className="font-medium">{format(selectedYacht.cabins)}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Berths:</span> <span className="font-medium">{format(selectedYacht.berths)}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Heads:</span> <span className="font-medium">{format(selectedYacht.heads)}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Max Occupancy:</span> <span className="font-medium">{format(selectedYacht.maxOccupancy)}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Engine HP:</span> <span className="font-medium">{format(selectedYacht.engineHp)}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Engine:</span> <span className="font-medium">{selectedYacht.engineType ?? '—'}</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Fuel:</span> <span className="font-medium">{format(selectedYacht.fuelCapacity)} L</span></div>
              <div className="flex justify-between sm:block"><span className="text-gray-500 sm:text-xs sm:uppercase sm:tracking-wide">Water:</span> <span className="font-medium">{format(selectedYacht.waterCapacity)} L</span></div>
            </div>
            {selectedYacht.description && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide mb-1">Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedYacht.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
