"use client";

import { useEffect, useState, useCallback } from "react";

interface VerificationStatus {
  total: number;
  neverVerified: number;
  verifiedRecently: number;
  inProduction: number;
  outOfProduction: number;
  unknown: number;
  defunctManufacturers: number;
}

interface RunStats {
  totalCandidates: number;
  processed: number;
  verified: number;
  updated: number;
  discrepancies: number;
  noData: number;
  errors: number;
  durationMs: number;
}

export default function VerificationDashboard() {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [runStats, setRunStats] = useState<RunStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(10);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/verify-models");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const runVerification = async () => {
    setRunning(true);
    setError(null);
    setRunStats(null);
    try {
      const res = await fetch(`/api/admin/verify-models?limit=${limit}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRunStats(data);
      fetchStatus(); // Refresh
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
        <h3 className="font-semibold mb-2">Error loading verification status</h3>
        <p>{error}</p>
        <button
          onClick={fetchStatus}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Data Verification Status</h2>
        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Models" value={status.total} />
            <StatCard
              label="Never Verified"
              value={status.neverVerified}
              danger={status.neverVerified > 0}
            />
            <StatCard
              label="Verified (90d)"
              value={status.verifiedRecently}
              success
            />
            <StatCard
              label="In Production"
              value={status.inProduction}
              success
            />
            <StatCard
              label="Out of Production"
              value={status.outOfProduction}
            />
            <StatCard
              label="Unknown Status"
              value={status.unknown}
              danger={status.unknown > 0}
            />
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Run Verification</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">
            Models per run:
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="ml-2 border rounded px-2 py-1"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </label>
          <button
            onClick={runVerification}
            disabled={running}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {running ? "Running..." : "Verify Now"}
          </button>
        </div>

        {runStats && (
          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <h4 className="font-semibold mb-2">Last Run Results</h4>
            <div className="grid grid-cols-3 md:grid-cols-7 gap-2 text-sm">
              <Stat label="Candidates" value={runStats.totalCandidates} />
              <Stat label="Processed" value={runStats.processed} />
              <Stat label="Verified" value={runStats.verified} green />
              <Stat label="Updated" value={runStats.updated} blue />
              <Stat
                label="Discrepancies"
                value={runStats.discrepancies}
                red
              />
              <Stat label="No Data" value={runStats.noData} />
              <Stat label="Errors" value={runStats.errors} red />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Duration: {(runStats.durationMs / 1000).toFixed(1)}s
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  success,
  danger,
}: {
  label: string;
  value: number;
  success?: boolean;
  danger?: boolean;
}) {
  const color = danger
    ? "text-red-600"
    : success
      ? "text-green-600"
      : "text-gray-900";
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  green,
  blue,
  red,
}: {
  label: string;
  value: number;
  green?: boolean;
  blue?: boolean;
  red?: boolean;
}) {
  const color = red
    ? "text-red-600"
    : green
      ? "text-green-600"
      : blue
        ? "text-blue-600"
        : "text-gray-900";
  return (
    <div>
      <div className={`font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
