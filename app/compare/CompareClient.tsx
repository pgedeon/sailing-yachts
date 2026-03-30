"use client";

import { useState, useEffect, useRef } from "react";
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
  sourceUrl?: string | null;
  sourceAttribution?: string | null;
  adminLinks?: any;
  specsByGroup?: Record<string, any[]>;
  images?: any[];
  reviews?: any[];
}

interface YachtOption {
  id: number;
  manufacturer: string;
  modelName: string;
  year: number | null;
  lengthOverall: number | null;
}

interface CompareClientProps {
  initialIds: number[];
}

export function CompareClient({ initialIds }: CompareClientProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>(initialIds);
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [allYachts, setAllYachts] = useState<YachtOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all available yachts for the picker
  useEffect(() => {
    fetch('/api/yachts?limit=100')
      .then(r => r.json())
      .then(data => {
        const opts: YachtOption[] = (data.yachts || []).map((y: any) => ({
          id: y.id,
          manufacturer: y.manufacturer || y.manufacturer_name || '',
          modelName: y.modelName || y.model_name || '',
          year: y.year ?? null,
          lengthOverall: y.lengthOverall ?? y.length_overall ?? null,
        }));
        setAllYachts(opts);
        setLoadingOptions(false);
      })
      .catch(() => setLoadingOptions(false));
  }, []);

  // Fetch compared yachts when selection changes
  const lastFetchKey = useRef('');
  useEffect(() => {
    const key = selectedIds.sort().join(',');
    if (!key || key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    if (selectedIds.length === 0) {
      setYachts([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`/api/compare?ids=${selectedIds.join(',')}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch compare data');
        return res.json();
      })
      .then(data => {
        setYachts(data.yachts || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedIds]);

  const toggleYacht = (id: number) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev; // max 3
      const next = [...prev, id];
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('ids', next.join(','));
      window.history.replaceState({}, '', url.toString());
      return next;
    });
    lastFetchKey.current = '';
  };

  const removeYacht = (id: number) => {
    setSelectedIds(prev => {
      const next = prev.filter(x => x !== id);
      const url = new URL(window.location.href);
      if (next.length) {
        url.searchParams.set('ids', next.join(','));
      } else {
        url.searchParams.delete('ids');
      }
      window.history.replaceState({}, '', url.toString());
      return next;
    });
    lastFetchKey.current = '';
  };

  const fields: { key: keyof Yacht; label: string; unit?: string }[] = [
    { key: 'lengthOverall', label: 'Length Overall', unit: 'm' },
    { key: 'beam', label: 'Beam', unit: 'm' },
    { key: 'draft', label: 'Draft', unit: 'm' },
    { key: 'displacement', label: 'Displacement', unit: 'kg' },
    { key: 'sailAreaMain', label: 'Sail Area Main', unit: 'm²' },
    { key: 'rigType', label: 'Rig Type' },
    { key: 'keelType', label: 'Keel Type' },
    { key: 'hullMaterial', label: 'Hull Material' },
    { key: 'cabins', label: 'Cabins' },
    { key: 'berths', label: 'Berths' },
    { key: 'heads', label: 'Heads' },
    { key: 'maxOccupancy', label: 'Max Occupancy' },
    { key: 'engineHp', label: 'Engine HP' },
    { key: 'engineType', label: 'Engine Type' },
    { key: 'fuelCapacity', label: 'Fuel Capacity', unit: 'L' },
    { key: 'waterCapacity', label: 'Water Capacity', unit: 'L' },
  ];

  const formatValue = (value: number | string | null | undefined, unit?: string) => {
    if (value === null || value === undefined) return '—';
    const suffix = unit ? ` ${unit}` : '';
    if (typeof value === 'number') {
      const formatted = Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${formatted}${suffix}`;
    }
    return String(value);
  };

  const fmt = (v: number | null | undefined) => v != null ? v.toLocaleString() : '—';

  // Highlight best numeric value in a row
  const highlightBest = (field: keyof Yacht, value: any) => {
    if (yachts.length < 2 || value === null || value === undefined || typeof value !== 'number') return '';
    const numVals = yachts.map(y => y[field] as number | null).filter(v => v !== null && v !== undefined) as number[];
    if (numVals.length < 2) return '';
    // Lower is better for draft, displacement, ballast. Higher is better for the rest.
    const lowerBetter = ['draft', 'displacement', 'ballast'].includes(field);
    const best = lowerBetter ? Math.min(...numVals) : Math.max(...numVals);
    return value === best ? 'font-bold text-green-700' : '';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Compare Yachts</h1>

      {/* Yacht Picker */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">
          Select yachts to compare
          <span className="text-sm font-normal text-gray-500 ml-2">({selectedIds.length}/3 selected)</span>
        </h2>

        {loadingOptions ? (
          <p className="text-gray-500">Loading yachts...</p>
        ) : allYachts.length === 0 ? (
          <p className="text-gray-500">No yachts available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allYachts.map(y => {
              const isSelected = selectedIds.includes(y.id);
              const isDisabled = !isSelected && selectedIds.length >= 3;
              return (
                <button
                  key={y.id}
                  onClick={() => !isDisabled && toggleYacht(y.id)}
                  disabled={isDisabled}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-gray-400'
                  }`}
                >
                  <div className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center ${
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{y.manufacturer} {y.modelName}</div>
                    <div className="text-xs text-gray-500">
                      {y.year ?? '—'} · {y.lengthOverall ? `${y.lengthOverall}m` : '—'} LOA
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedIds.length >= 2 && (
          <p className="mt-3 text-sm text-gray-500">
            ✓ {selectedIds.length} yachts selected — scroll down to see the comparison.
          </p>
        )}
        {selectedIds.length === 1 && (
          <p className="mt-3 text-sm text-amber-600">
            Select at least one more yacht to compare.
          </p>
        )}
      </div>

      {/* Comparison Table */}
      {loading && <div className="p-8 text-center">Loading comparison...</div>}
      {error && <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg mb-4">{error}</div>}

      {yachts.length >= 2 && !loading && (
        <>
          {/* Selected yacht chips */}
          <div className="flex flex-wrap gap-2 mb-4">
            {yachts.map(y => (
              <span key={y.id} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {y.manufacturer} {y.modelName}
                <button onClick={() => removeYacht(y.id)} className="ml-1 text-blue-500 hover:text-blue-700" title="Remove">×</button>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specification</th>
                  {yachts.map(yacht => (
                    <th key={yacht.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <Link href={`/yachts/${yacht.slug}`} className="hover:underline">
                        {yacht.manufacturer} {yacht.modelName}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map(field => (
                  <tr key={field.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                    {yachts.map(yacht => {
                      const value = yacht[field.key] as any;
                      const display = formatValue(value, field.unit);
                      const highlight = highlightBest(field.key, value);
                      return (
                        <td key={yacht.id} className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${highlight}`}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6">
        <Link href="/yachts" className="text-blue-600 hover:underline">← Back to browse</Link>
      </div>
    </div>
  );
}
