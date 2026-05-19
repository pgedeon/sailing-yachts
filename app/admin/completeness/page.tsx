import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface YachtAuditEntry {
  id: number
  modelName: string
  manufacturer: string
  year: number | null
  slug: string | null
  score: number
  level: { label: string; color: string; bgColor: string; textColor: string }
  missingFields: string[]
  missingCount: number
  mediaCount: number
}

interface AuditStats {
  totalYachts: number
  averageScore: number
  scoreDistribution: {
    comprehensive: number
    good: number
    partial: number
    basic: number
    minimal: number
  }
  topMissingFields: { field: string; count: number; percentage: number }[]
  categoryCompletion: Record<string, { label: string; completionRate: number; weight: number }>
}

export default async function AdminCompletenessPage() {
  await requireAdmin()

  let stats: AuditStats | null = null
  let needsAttention: YachtAuditEntry[] = []
  let fetchError: string | null = null

  try {
    const headersList = headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/completeness`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) throw new Error('Failed to fetch audit data')
    const data = await res.json()
    stats = data.stats
    needsAttention = data.needsAttention ?? []
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading audit: {fetchError}
          </div>
          <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const dist = stats.scoreDistribution

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Spec Completeness Audit</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Total Yachts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalYachts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <p className="text-3xl font-bold text-blue-600">{stats.averageScore}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Low Quality (&lt;30%)</p>
            <p className="text-3xl font-bold text-red-600">{dist.minimal + dist.basic}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">High Quality (≥80%)</p>
            <p className="text-3xl font-bold text-green-600">{dist.comprehensive}</p>
          </div>
        </div>

        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h2>
          <div className="space-y-3">
            {[
              { label: 'Comprehensive (80-100%)', count: dist.comprehensive, color: 'bg-green-500', textColor: 'text-green-700' },
              { label: 'Good (60-79%)', count: dist.good, color: 'bg-blue-500', textColor: 'text-blue-700' },
              { label: 'Partial (40-59%)', count: dist.partial, color: 'bg-yellow-500', textColor: 'text-yellow-700' },
              { label: 'Basic (20-39%)', count: dist.basic, color: 'bg-orange-500', textColor: 'text-orange-700' },
              { label: 'Minimal (0-19%)', count: dist.minimal, color: 'bg-red-500', textColor: 'text-red-700' },
            ].map(({ label, count, color, textColor }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-48">{label}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${stats.totalYachts > 0 ? (count / stats.totalYachts) * 100 : 0}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${textColor} w-16 text-right`}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Category Completion */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Category Completion</h2>
            <div className="space-y-3">
              {Object.entries(stats.categoryCompletion).map(([key, cat]) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.label}</span>
                    <span className="font-medium text-gray-900">{cat.completionRate}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        cat.completionRate >= 80 ? 'bg-green-500' :
                        cat.completionRate >= 60 ? 'bg-blue-500' :
                        cat.completionRate >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${cat.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Missing Fields */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Most Commonly Missing Fields</h2>
            <div className="space-y-2">
              {stats.topMissingFields.map(({ field, count, percentage }) => (
                <div key={field} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700 font-mono">{field}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{count} yachts</span>
                    <span className="text-sm font-medium text-red-600">{percentage}%</span>
                  </div>
                </div>
              ))}
              {stats.topMissingFields.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">All fields populated!</p>
              )}
            </div>
          </div>
        </div>

        {/* Yachts Needing Attention */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Yachts Needing Attention (sorted by lowest score)
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Missing Fields</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {needsAttention.map((yacht) => (
                  <tr key={yacht.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{yacht.modelName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{yacht.manufacturer}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{yacht.year ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-full rounded-full ${yacht.level.color}`}
                            style={{ width: `${yacht.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{yacht.score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${yacht.level.bgColor} ${yacht.level.textColor}`}>
                        {yacht.level.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate" title={yacht.missingFields.join(', ')}>
                      {yacht.missingCount} fields: {yacht.missingFields.slice(0, 3).join(', ')}{yacht.missingCount > 3 ? '...' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{yacht.mediaCount}</td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/admin/yachts/${yacht.id}/edit`}
                        prefetch={false}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs bg-blue-50"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {needsAttention.length === 0 && (
            <p className="text-gray-500 text-center py-8">No yachts found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
