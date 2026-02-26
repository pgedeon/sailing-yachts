"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Yacht {
  id: string;
  name: string;
  manufacturer: string;
  lengthOverall?: number;
  beam?: number;
  draft?: number;
  displacement?: number;
  year?: number;
  imageUrl?: string;
}

function YachtsContent() {
  const searchParams = useSearchParams();
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [selectedMfgs, setSelectedMfgs] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    const mfgParam = searchParams.get("manufacturers");
    const mfgs = mfgParam ? mfgParam.split(",") : [];
    setSelectedMfgs(mfgs);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  useEffect(() => {
    fetchYachts(page, selectedMfgs);
  }, [page, selectedMfgs]);

  async function fetchManufacturers() {
    const res = await fetch("/api/manufacturers");
    const json = await res.json();
    setManufacturers(json.manufacturers || []);
  }

  async function fetchYachts(pageNum: number, mfgs: string[]) {
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: limit.toString(),
      sort: "manufacturer",
      order: "asc",
    });
    if (mfgs.length > 0) {
      params.append("manufacturers", mfgs.join(","));
    }
    const res = await fetch(`/api/yachts?${params.toString()}`);
    const json = await res.json();
    setYachts(json.yachts);
    setTotalPages(json.totalPages);
  }

  function toggleMfg(mfg: string) {
    setSelectedMfgs((prev) =>
      prev.includes(mfg) ? prev.filter((m) => m !== mfg) : [...prev, mfg]
    );
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-white border-r p-4 overflow-y-auto max-h-screen">
        <h2 className="font-semibold mb-4">Manufacturers</h2>
        <div className="space-y-2">
          {manufacturers.map((mfg) => (
            <label key={mfg} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedMfgs.includes(mfg)}
                onChange={() => toggleMfg(mfg)}
                className="rounded text-blue-600"
              />
              <span className="text-sm">{mfg}</span>
            </label>
          ))}
        </div>
      </aside>

      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Sailing Yachts</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yachts.map((yacht) => (
            <div key={yacht.id} className="border rounded-lg p-4 bg-white shadow-sm">
              {yacht.imageUrl && (
                <img
                  src={yacht.imageUrl}
                  alt={yacht.name}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              <h3 className="font-bold text-lg">{yacht.name}</h3>
              <p className="text-gray-600">{yacht.manufacturer}</p>
              <div className="mt-2 text-sm text-gray-700">
                <p>LOA: {yacht.lengthOverall?.toFixed(1) ?? "N/A"} ft</p>
                <p>Beam: {yacht.beam?.toFixed(1) ?? "N/A"} ft</p>
                <p>Draft: {yacht.draft?.toFixed(1) ?? "N/A"} ft</p>
                {yacht.displacement && <p>Displacement: {yacht.displacement.toLocaleString()} lbs</p>}
                {yacht.year && <p>Year: {yacht.year}</p>}
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="mt-8 flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-4 py-2">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function YachtsPageWithSuspense() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <YachtsContent />
    </Suspense>
  );
}
