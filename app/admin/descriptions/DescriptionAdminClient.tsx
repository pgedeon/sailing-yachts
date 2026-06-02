"use client";

import { useState, useEffect, useCallback } from "react";

interface DescriptionStats {
  total: number;
  withDescription: number;
  missing: number;
  generated: number;
  pending: number;
  approved: number;
  rejected: number;
  manual: number;
}

interface PendingDescription {
  id: number;
  modelName: string;
  slug: string | null;
  description: string | null;
  descriptionSource: string | null;
  descriptionStatus: string | null;
  descriptionGeneratedAt: string | null;
  manufacturerName: string | null;
}

interface GenerationResult {
  totalCandidates: number;
  generated: number;
  skipped: number;
  errors: number;
}

export default function DescriptionAdminClient() {
  const [stats, setStats] = useState<DescriptionStats | null>(null);
  const [pending, setPending] = useState<PendingDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/descriptions");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/descriptions?action=pending&limit=50"
      );
      if (res.ok) {
        const data = await res.json();
        setPending(data.pending || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchStats(), fetchPending()]).finally(() =>
      setLoading(false)
    );
  }, [fetchStats, fetchPending]);

  const handleGenerate = async (dryRun: boolean) => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          limit: 50,
          dryRun,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const result = data as GenerationResult;
        setMessage({
          type: "success",
          text: dryRun
            ? `Dry run: ${result.generated} descriptions would be generated, ${result.skipped} skipped`
            : `Generated ${result.generated} descriptions (${result.skipped} skipped). They are pending review.`,
        });
        fetchStats();
        fetchPending();
      } else {
        setMessage({ type: "error", text: data.error || "Generation failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (yachtId: number) => {
    try {
      const res = await fetch("/api/admin/descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", yachtId }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== yachtId));
        fetchStats();
      }
    } catch {
      // ignore
    }
  };

  const handleReject = async (yachtId: number) => {
    try {
      const res = await fetch("/api/admin/descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", yachtId }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== yachtId));
        fetchStats();
      }
    } catch {
      // ignore
    }
  };

  const handleApproveAll = async () => {
    if (!confirm("Approve all pending descriptions?")) return;
    try {
      const res = await fetch("/api/admin/descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve-all" }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Approved ${data.approved} descriptions`,
        });
        fetchStats();
        fetchPending();
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  if (!stats) {
    return <div className="text-red-500">Failed to load stats</div>;
  }

  const coveragePct =
    stats.total > 0
      ? ((stats.withDescription / stats.total) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-md ${message.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
        >
          {message.text}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total Yachts</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Coverage</p>
          <p className="text-2xl font-bold">{coveragePct}%</p>
          <p className="text-xs text-gray-400">
            {stats.withDescription} of {stats.total}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Missing</p>
          <p className="text-2xl font-bold text-orange-600">
            {stats.missing}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Pending Review</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold mb-4">Generate Descriptions</h2>
        <p className="text-sm text-gray-600 mb-4">
          Auto-generate descriptions from yacht spec data for yachts missing
          descriptions. Generated descriptions go into a pending review queue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleGenerate(true)}
            disabled={generating || stats.missing === 0}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Running..." : "Dry Run (Preview)"}
          </button>
          <button
            onClick={() => handleGenerate(false)}
            disabled={generating || stats.missing === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating..." : "Generate & Queue for Review"}
          </button>
        </div>
      </div>

      {/* Pending Review Queue */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Pending Review ({pending.length})
          </h2>
          {pending.length > 0 && (
            <button
              onClick={handleApproveAll}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
            >
              Approve All
            </button>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No pending descriptions. Generate new ones or all have been
            reviewed.
          </p>
        ) : (
          <div className="space-y-4">
            {pending.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {item.manufacturerName} {item.modelName}
                    </h3>
                    {item.slug && (
                      <a
                        href={`/yachts/${item.slug}`}
                        className="text-xs text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View yacht page →
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md hover:bg-green-200"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md hover:bg-red-200"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {item.description}
                </p>
                {item.descriptionGeneratedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    Generated{" "}
                    {new Date(item.descriptionGeneratedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
