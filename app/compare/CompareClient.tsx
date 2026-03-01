"use client";

import { useState, useEffect } from "react";
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

interface CompareClientProps {
  initialIds: number[];
}

export function CompareClient({ initialIds }: CompareClientProps) {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialIds.length) {
      setError('No yachts selected for comparison.');
      return;
    }
    if (initialIds.length > 3) {
      setError('Maximum 3 yachts can be compared.');
      return;
    }
    setLoading(true);
    fetch(`/api/compare?ids=${initialIds.join(',')}`)
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
  }, [initialIds]);

  if (loading) return <div className="p-8 text-center">Loading comparison...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (yachts.length === 0) return <div className="p-8 text-center">No yachts to compare.</div>;

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
    if (typeof value === 'number') {
      return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return String(value);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Compare Yachts</h1>
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
              <tr key={field.key}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.label}</td>
                {yachts.map(yacht => {
                  const value = (yacht[field.key] as any);
                  const display = formatValue(value, field.unit);
                  return (
                    <td key={yacht.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <Link href="/yachts" className="text-blue-600 hover:underline">Back to browse</Link>
      </div>
    </div>
  );
}
