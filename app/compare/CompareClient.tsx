"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

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
  designNotes: string | null;
  description: string | null;
}

interface YachtOption {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
  rigType: string | null;
  cabins: number | null;
}

interface CompareClientProps {
  initialIds: number[];
}

const MAX_COMPARE = 3;

const COMPARE_FIELDS: { key: keyof Yacht; label: string; unit?: string; lowerBetter?: boolean }[] = [
  { key: 'lengthOverall', label: 'Length Overall', unit: 'm' },
  { key: 'beam', label: 'Beam', unit: 'm' },
  { key: 'draft', label: 'Draft', unit: 'm', lowerBetter: true },
  { key: 'displacement', label: 'Displacement', unit: 'kg', lowerBetter: true },
  { key: 'ballast', label: 'Ballast', unit: 'kg' },
  { key: 'sailAreaMain', label: 'Sail Area', unit: 'm²' },
  { key: 'rigType', label: 'Rig Type' },
  { key: 'keelType', label: 'Keel Type' },
  { key: 'hullMaterial', label: 'Hull Material' },
  { key: 'cabins', label: 'Cabins' },
  { key: 'berths', label: 'Berths' },
  { key: 'heads', label: 'Heads' },
  { key: 'maxOccupancy', label: 'Max Occupancy' },
  { key: 'engineHp', label: 'Engine HP' },
  { key: 'engineType', label: 'Engine Type' },
  { key: 'fuelCapacity', label: 'Fuel', unit: 'L' },
  { key: 'waterCapacity', label: 'Water', unit: 'L' },
];

const YACHT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-400', ring: 'ring-blue-200', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-400', ring: 'ring-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-400', ring: 'ring-amber-200', dot: 'bg-amber-500' },
];

export function CompareClient({ initialIds }: CompareClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [allYachts, setAllYachts] = useState<YachtOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Fetch all yachts for the picker
  useEffect(() => {
    fetch('/api/yachts?limit=100')
      .then(r => r.json())
      .then(data => {
        const opts: YachtOption[] = (data.yachts || []).map((y: any) => ({
          id: y.id,
          manufacturer: y.manufacturer || '',
          modelName: y.modelName || '',
          year: y.year ?? null,
          lengthOverall: y.lengthOverall ?? null,
          rigType: y.rigType ?? null,
          cabins: y.cabins ?? null,
        }));
        setAllYachts(opts);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  // Fetch compared yachts when selection changes
  const lastFetchKey = useRef('');
  useEffect(() => {
    const key = [...selectedIds].sort().join(',');
    if (!key || key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    if (selectedIds.length === 0) {
      setYachts([]);
      return;
    }

    setLoading(true);
    fetch(`/api/compare?ids=${selectedIds.join(',')}`)
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch')))
      .then(data => { setYachts(data.yachts || []); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [selectedIds]);

  // Close picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleYacht = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        updateUrl(next);
        return next;
      }
      if (prev.length >= MAX_COMPARE) return prev;
      const next = [...prev, id];
      updateUrl(next);
      return next;
    });
    lastFetchKey.current = '';
  };

  const removeYacht = (id: number) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id);
      updateUrl(next);
      return next;
    });
    lastFetchKey.current = '';
  };

  const updateUrl = (ids: number[]) => {
    const url = new URL(window.location.href);
    if (ids.length) url.searchParams.set('ids', ids.join(','));
    else url.searchParams.delete('ids');
    window.history.replaceState({}, '', url.toString());
  };

  // Group yachts by manufacturer for the dropdown
  const filteredYachts = useMemo(() => {
    if (!search.trim()) return allYachts;
    const q = search.toLowerCase();
    return allYachts.filter(y =>
      y.manufacturer.toLowerCase().includes(q) ||
      y.modelName.toLowerCase().includes(q) ||
      `${y.manufacturer} ${y.modelName}`.toLowerCase().includes(q)
    );
  }, [allYachts, search]);

  const groupedYachts = useMemo(() => {
    const groups: Record<string, YachtOption[]> = {};
    for (const y of filteredYachts) {
      const key = y.manufacturer || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(y);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredYachts]);

  const getSlotIndex = (id: number) => selectedIds.indexOf(id);

  const formatValue = (value: number | string | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return '—';
    const suffix = unit ? ` ${unit}` : '';
    if (typeof value === 'number') {
      return `${Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
    }
    return String(value);
  };

  const highlightBest = (field: keyof Yacht, value: any, fieldDef: typeof COMPARE_FIELDS[0]) => {
    if (yachts.length < 2 || value === null || value === undefined || typeof value !== 'number') return '';
    const numVals = yachts.map(y => y[field] as number | null).filter((v): v is number => v !== null && v !== undefined);
    if (numVals.length < 2) return '';
    const best = fieldDef.lowerBetter ? Math.min(...numVals) : Math.max(...numVals);
    return value === best ? 'font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded' : '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compare Yachts</h1>
        <p className="mt-1 text-gray-500">Select up to {MAX_COMPARE} yachts to compare side by side</p>
      </div>

      {/* Selection Area */}
      <div className="mb-8">
        {/* Selected Yacht Slots */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {Array.from({ length: MAX_COMPARE }).map((_, i) => {
            const id = selectedIds[i];
            const yacht = id ? allYachts.find(y => y.id === id) : null;
            const color = YACHT_COLORS[i];
            return (
              <div
                key={i}
                className={`relative rounded-xl border-2 border-dashed p-4 transition-all ${
                  yacht ? `${color.border} ${color.bg} border-solid` : 'border-gray-300 bg-white'
                }`}
              >
                {yacht ? (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${color.dot} flex-shrink-0 mt-1`} />
                      <div>
                        <div className={`font-semibold ${color.text}`}>{yacht.manufacturer}</div>
                        <div className="text-gray-800 font-medium">{yacht.modelName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {yacht.year ?? '—'} · {yacht.lengthOverall ? `${yacht.lengthOverall}m` : '—'} LOA
                          {yacht.cabins ? ` · ${yacht.cabins} cabins` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeYacht(id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setPickerOpen(true)}
                    className="w-full text-center py-3 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span className="text-sm">Add yacht</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add/Change Button */}
        {selectedIds.length < MAX_COMPARE && (
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {selectedIds.length === 0 ? 'Choose yachts to compare' : 'Add another yacht'}
          </button>
        )}
      </div>

      {/* Yacht Picker Dropdown */}
      {pickerOpen && (
        <div ref={pickerRef} className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Search by manufacturer or model..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable List */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {loadingOptions ? (
              <div className="p-6 text-center text-gray-400 text-sm">Loading yachts...</div>
            ) : groupedYachts.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No yachts match your search.</div>
            ) : (
              groupedYachts.map(([manufacturer, yachts]) => (
                <div key={manufacturer}>
                  <div className="sticky top-0 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    {manufacturer}
                  </div>
                  {yachts.map(y => {
                    const isSelected = selectedIds.includes(y.id);
                    const slotIdx = getSlotIndex(y.id);
                    const color = slotIdx >= 0 ? YACHT_COLORS[slotIdx] : null;
                    return (
                      <button
                        key={y.id}
                        onClick={() => toggleYacht(y.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors border-b border-gray-50 last:border-0 ${
                          isSelected
                            ? `${color?.bg || 'bg-blue-50'} ${color?.text || 'text-blue-800'}`
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {/* Checkbox/indicator */}
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center ${
                          isSelected
                            ? `${color?.dot || 'bg-blue-500'}`
                            : 'border border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium">{y.modelName}</span>
                          <span className="text-gray-400 ml-2">
                            {y.year ?? '—'} · {y.lengthOverall ? `${y.lengthOverall}m` : '—'}
                          </span>
                        </div>
                        {isSelected && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${color?.bg} ${color?.text} font-medium`}>
                            Slot {slotIdx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-gray-400">{selectedIds.length}/{MAX_COMPARE} selected</span>
            <button
              onClick={() => setPickerOpen(false)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Prompt when nothing selected */}
      {selectedIds.length === 0 && !pickerOpen && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <p className="text-lg font-medium text-gray-500">Select yachts to compare</p>
          <p className="text-sm mt-1">Choose 2 or 3 yachts above to see a detailed comparison</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-3 text-gray-500 text-sm">Loading comparison...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 text-center text-red-700 bg-red-50 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Comparison Table */}
      {yachts.length >= 2 && !loading && (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Spec</th>
                  {yachts.map((yacht, i) => (
                    <th key={yacht.id} className="px-5 py-3 text-left">
                      <Link href={`/yachts/${yacht.slug}`} className="hover:underline">
                        <span className={`inline-flex items-center gap-1.5`}>
                          <span className={`w-2.5 h-2.5 rounded-full ${YACHT_COLORS[i]?.dot}`} />
                          <span className="font-semibold text-gray-800">{yacht.manufacturer} {yacht.modelName}</span>
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {COMPARE_FIELDS.map(field => (
                  <tr key={field.key} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-gray-600 font-medium whitespace-nowrap">
                      {field.label}
                      {field.unit && <span className="text-gray-400 ml-1 text-xs">({field.unit})</span>}
                    </td>
                    {yachts.map((yacht, i) => {
                      const value = yacht[field.key] as any;
                      const display = formatValue(value, field.unit);
                      const highlight = highlightBest(field.key, value, field);
                      return (
                        <td key={yacht.id} className={`px-5 py-3 whitespace-nowrap ${highlight || 'text-gray-700'}`}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 bg-gray-50 border-t text-xs text-gray-400 flex items-center gap-1">
            <span className="font-semibold text-green-600">Green</span> = best value in row
          </div>
        </div>
      )}

      <div className="mt-8">
        <Link href="/yachts" className="text-blue-600 hover:underline text-sm">← Back to browse</Link>
      </div>
    </div>
  );
}
