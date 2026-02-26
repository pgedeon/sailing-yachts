"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ComparisonRow {
  category: string;
  unit?: string;
  values: Record<number, { value: number | string; hasValue: boolean }>;
}

export default function CompareClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [data, setData] = useState<{
    yachts: Array<{
      id: number;
      manufacturer: string;
      modelName: string;
      year: number;
      slug: string;
    }>;
    comparisonTable: ComparisonRow[];
  } | null>(null);
  const [loading, setLoading] = useState(!!idsParam);

  useEffect(() => {
    if (!idsParam) {
      setLoading(false);
      return;
    }
    fetch(`/api/compare?ids=${idsParam}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load comparison:", err);
        setLoading(false);
      });
  }, [idsParam]);

  if (!idsParam) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Compare Yachts</h1>
          <p className="text-muted-foreground mb-6">
            Select up to 3 yachts from the browse page to compare them side by
            side.
          </p>
          <Button asChild>
            <Link href="/yachts">Browse Yachts</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        Loading comparison…
      </div>
    );
  }

  if (data && data.yachts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        No yachts found to compare.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/yachts">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Browse
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Compare Yachts</h1>

      {/* Yacht headers */}
      <div
        className="grid gap-4 mb-8"
        style={{
          gridTemplateColumns: `repeat(${data?.yachts.length || 1}, minmax(0, 1fr))`,
        }}
      >
        {data?.yachts.map((yacht) => (
          <div
            key={yacht.id}
            className="text-center p-4 border border-border rounded-lg bg-card"
          >
            <div className="font-bold text-lg">{yacht.manufacturer}</div>
            <div className="font-medium">{yacht.modelName}</div>
            <div className="text-sm text-muted-foreground">{yacht.year}</div>
            <Button asChild variant="link" size="sm" className="mt-2">
              <Link href={`/yachts/${yacht.slug}`}>View Details</Link>
            </Button>
          </div>
        ))}
      </div>

      {data && data.comparisonTable.length > 0 ? (
        <>
          {/* Comparison table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">
                    Specification
                  </th>
                  {data.yachts.map((y) => (
                    <th
                      key={y.id}
                      className="px-4 py-2 text-center font-semibold"
                    >
                      {y.manufacturer} {y.modelName} ({y.year})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.comparisonTable.map((row) => (
                  <tr key={row.category} className="border-t">
                    <td className="px-4 py-2">
                      {row.category}
                      {row.unit && (
                        <span className="text-muted-foreground ml-1">
                          ({row.unit})
                        </span>
                      )}
                    </td>
                    {data.yachts.map((y) => {
                      const val = row.values[y.id];
                      return (
                        <td
                          key={y.id}
                          className={`px-4 py-2 text-center ${val.hasValue ? "" : "text-muted-foreground italic"}`}
                        >
                          {val.hasValue ? String(val.value) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No comparable specifications found.
        </div>
      )}
    </div>
  );
}
