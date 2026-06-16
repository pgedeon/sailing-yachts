"use client";

import { useState, useEffect, useCallback } from "react";

interface SecurityStats {
  rateLimit: {
    activeEntries: number;
    activeLoginLockouts: number;
    presets: {
      read: { limit: number; windowSeconds: number };
      write: { limit: number; windowSeconds: number };
      strict: { limit: number; windowSeconds: number };
    };
  };
  securityHeaders: {
    csp: boolean;
    hsts: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
    permissionsPolicy: boolean;
  };
  cors: {
    publicApiCors: boolean;
    adminApiNoCors: boolean;
  };
  validationCoverage: {
    totalWriteRoutes: number;
    validatedRoutes: number;
    unvalidatedRoutes: string[];
    coveragePercent: number;
  };
  middleware: {
    rateLimitingActive: boolean;
    bruteForceProtection: boolean;
    securityHeadersActive: boolean;
  };
}

export default function SecurityAuditDashboard() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/security");
      if (!res.ok) throw new Error("Failed to fetch security stats");
      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Audit</h1>
            <p className="text-gray-500 mt-1">P27.2 — Rate limiting, validation & security hardening</p>
          </div>
          <button
            onClick={fetchStats}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Validation Coverage"
            value={`${stats.validationCoverage.coveragePercent}%`}
            subtitle={`${stats.validationCoverage.validatedRoutes}/${stats.validationCoverage.totalWriteRoutes} write routes`}
            color={stats.validationCoverage.coveragePercent >= 90 ? "green" : "yellow"}
          />
          <SummaryCard
            title="Active Rate Limit Entries"
            value={String(stats.rateLimit.activeEntries)}
            subtitle={`${stats.rateLimit.activeLoginLockouts} login lockouts`}
            color="blue"
          />
          <SummaryCard
            title="Security Headers"
            value={`${Object.values(stats.securityHeaders).filter(Boolean).length}/6`}
            subtitle="CSP, HSTS, X-Frame, etc."
            color="green"
          />
          <SummaryCard
            title="Middleware Protection"
            value={`${[stats.middleware.rateLimitingActive, stats.middleware.bruteForceProtection, stats.middleware.securityHeadersActive].filter(Boolean).length}/3`}
            subtitle="Active layers"
            color="green"
          />
        </div>

        {/* Rate Limiting Section */}
        <Section title="Rate Limiting Configuration">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RateLimitCard
              name="Read Routes"
              limit={stats.rateLimit.presets.read.limit}
              window={stats.rateLimit.presets.read.windowSeconds}
              color="green"
            />
            <RateLimitCard
              name="Write Routes"
              limit={stats.rateLimit.presets.write.limit}
              window={stats.rateLimit.presets.write.windowSeconds}
              color="yellow"
            />
            <RateLimitCard
              name="Strict Routes"
              limit={stats.rateLimit.presets.strict.limit}
              window={stats.rateLimit.presets.strict.windowSeconds}
              color="red"
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Brute-Force Protection:</strong> Login route has dedicated protection with
              exponential backoff after 5 attempts, lockout after 10 attempts (30-min lockout, 15-min window).
              Currently <strong>{stats.rateLimit.activeLoginLockouts}</strong> IPs locked out.
            </p>
          </div>
        </Section>

        {/* Security Headers */}
        <Section title="Security Headers">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <HeaderRow name="Content-Security-Policy" enabled={stats.securityHeaders.csp} />
            <HeaderRow name="Strict-Transport-Security" enabled={stats.securityHeaders.hsts} />
            <HeaderRow name="X-Frame-Options" enabled={stats.securityHeaders.xFrameOptions} />
            <HeaderRow name="X-Content-Type-Options" enabled={stats.securityHeaders.xContentTypeOptions} />
            <HeaderRow name="Referrer-Policy" enabled={stats.securityHeaders.referrerPolicy} />
            <HeaderRow name="Permissions-Policy" enabled={stats.securityHeaders.permissionsPolicy} />
          </div>
        </Section>

        {/* Validation Coverage */}
        <Section title="Input Validation Coverage">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Coverage</span>
              <span className={`text-sm font-bold ${
                stats.validationCoverage.coveragePercent >= 90 ? "text-green-600" : "text-yellow-600"
              }`}>
                {stats.validationCoverage.coveragePercent}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  stats.validationCoverage.coveragePercent >= 90 ? "bg-green-500" : "bg-yellow-500"
                }`}
                style={{ width: `${stats.validationCoverage.coveragePercent}%` }}
              />
            </div>
          </div>
          {stats.validationCoverage.unvalidatedRoutes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Routes without validation ({stats.validationCoverage.unvalidatedRoutes.length})
              </h4>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm">
                  <tbody>
                    {stats.validationCoverage.unvalidatedRoutes.map((route) => (
                      <tr key={route} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2 text-gray-600 font-mono">{route}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Section>

        {/* CORS Policy */}
        <Section title="CORS Policy">
          <div className="space-y-2">
            <HeaderRow name="Public API (v1) — CORS enabled" enabled={stats.cors.publicApiCors} />
            <HeaderRow name="Admin API — No CORS (same-origin only)" enabled={stats.cors.adminApiNoCors} />
          </div>
        </Section>

        <div className="mt-8 text-sm text-gray-400">
          <p>Security audit dashboard — auto-generated from middleware and route analysis.</p>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: "green" | "yellow" | "red" | "blue";
}) {
  const colors = {
    green: "border-green-200 bg-green-50",
    yellow: "border-yellow-200 bg-yellow-50",
    red: "border-red-200 bg-red-50",
    blue: "border-blue-200 bg-blue-50",
  };
  const textColors = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
    blue: "text-blue-700",
  };
  return (
    <div className={`p-5 rounded-lg border ${colors[color]}`}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function RateLimitCard({
  name,
  limit,
  window,
  color,
}: {
  name: string;
  limit: number;
  window: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "border-green-200 bg-green-50 text-green-700",
    yellow: "border-yellow-200 bg-yellow-50 text-yellow-700",
    red: "border-red-200 bg-red-50 text-red-700",
  };
  const windowLabel = window >= 3600 ? `${window / 3600}h` : window >= 60 ? `${window / 60}min` : `${window}s`;
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-sm font-medium mb-1">{name}</p>
      <p className="text-2xl font-bold">
        {limit}
        <span className="text-sm font-normal text-gray-500"> / {windowLabel}</span>
      </p>
    </div>
  );
}

function HeaderRow({ name, enabled }: { name: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <span className="text-sm font-mono text-gray-700">{name}</span>
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        {enabled ? "✓ Enabled" : "✗ Missing"}
      </span>
    </div>
  );
}
