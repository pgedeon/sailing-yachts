'use client';

import { useState } from 'react';

interface Props {
  candidatesWithoutPrices: number;
}

export default function AggregationDashboard({ candidatesWithoutPrices }: Props) {
  const [running, setRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const [runResult, setRunResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDryRun() {
    setRunning(true);
    setError(null);
    setDryRunResult(null);
    try {
      const res = await fetch('/api/admin/prices/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true, limit: 250 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setDryRunResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  async function handleRun() {
    if (!confirm(`Generate estimated prices for ${candidatesWithoutPrices} yachts? This will create new price records.`)) return;
    setRunning(true);
    setError(null);
    setRunResult(null);
    try {
      const res = await fetch('/api/admin/prices/aggregate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 250 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRunResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Price Estimation Pipeline</h2>
      <p className="text-sm text-gray-600 mb-4">
        Generate estimated prices for yachts based on their specifications (length, displacement, age, manufacturer).
        Prices are estimated in EUR with conservative ranges.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
        <div className="text-sm text-blue-800">
          <strong>{candidatesWithoutPrices}</strong> yachts eligible for price estimation
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handleDryRun}
          disabled={running}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {running && !runResult ? 'Running...' : '🔍 Dry Run Preview'}
        </button>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? 'Running...' : '▶ Run Estimation'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="text-sm text-red-800">Error: {error}</div>
        </div>
      )}

      {dryRunResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Dry Run Results</h3>
          <div className="text-sm text-gray-600">
            <div>Candidates: {dryRunResult.candidatesTotal}</div>
            <div>Price estimates generated: {dryRunResult.resultsFound}</div>
            <div>Status: {dryRunResult.status}</div>
          </div>
        </div>
      )}

      {runResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">✅ Run Complete</h3>
          <div className="text-sm text-green-700">
            <div>Candidates evaluated: {runResult.candidatesTotal}</div>
            <div>Estimates generated: {runResult.resultsFound}</div>
            <div>Prices created: {runResult.pricesCreated}</div>
            <div>Prices updated: {runResult.pricesUpdated}</div>
            {runResult.errors.length > 0 && (
              <div className="mt-2 text-red-600">
                Errors: {runResult.errors.join('; ')}
              </div>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh to see updated stats →
          </button>
        </div>
      )}
    </div>
  );
}
