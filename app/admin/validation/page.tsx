import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface ValidationIssue {
  rule: string
  severity: 'error' | 'warning' | 'info'
  message: string
  field: string
  value: unknown
}

interface DerivedSpec {
  key: string
  label: string
  value: number | null
  unit: string
  description: string
}

interface YachtValidationEntry {
  id: number
  modelName: string
  manufacturer: string
  year: number | null
  slug: string | null
  issues: ValidationIssue[]
  derivedSpecs: DerivedSpec[]
  issueCount: { error: number; warning: number; info: number }
  isValid: boolean
}

interface BulkValidationSummary {
  totalYachts: number
  yachtsWithErrors: number
  yachtsWithWarnings: number
  yachtsClean: number
  totalIssues: { error: number; warning: number; info: number }
  topIssues: { rule: string; message: string; count: number; severity: string }[]
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[severity] || styles.info}`}>
      {severity}
    </span>
  )
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <SeverityBadge severity={issue.severity} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{issue.message}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          Field: <code className="bg-gray-100 px-1 rounded">{issue.field}</code>
          {issue.value !== null && issue.value !== undefined && (
            <span className="ml-2">Value: {String(issue.value)}</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default async function AdminValidationPage() {
  await requireAdmin()

  let summary: BulkValidationSummary | null = null
  let yachtsWithIssues: YachtValidationEntry[] = []
  let fetchError: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/validation`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) throw new Error('Failed to fetch validation data')
    const data = await res.json()
    summary = data.summary
    yachtsWithIssues = data.yachtsWithIssues ?? []
  } catch (error) {
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error loading validation data: {fetchError}
          </div>
          <Link href="/admin" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Spec Validation Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Automatic validation rules catch data errors and anomalies in yacht specifications
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Yachts</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalYachts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">With Errors</p>
            <p className="text-2xl font-bold text-red-600">{summary.yachtsWithErrors}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">With Warnings</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.yachtsWithWarnings}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Clean</p>
            <p className="text-2xl font-bold text-green-600">{summary.yachtsClean}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Issues</p>
            <p className="text-2xl font-bold text-blue-600">
              {summary.totalIssues.error + summary.totalIssues.warning + summary.totalIssues.info}
            </p>
          </div>
        </div>

        {/* Issue breakdown bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Issue Breakdown</h2>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">{summary.totalIssues.error} errors</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-gray-600">{summary.totalIssues.warning} warnings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">{summary.totalIssues.info} info</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Issues */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Most Common Issues</h2>
            {summary.topIssues.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No issues found — all specs look good!</p>
            ) : (
              <div className="space-y-2">
                {summary.topIssues.map((issue) => (
                  <div key={issue.rule} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <SeverityBadge severity={issue.severity} />
                      <span className="text-sm text-gray-700 truncate">{issue.message}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 ml-4">{issue.count} yachts</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Data Health</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Error-free yachts</span>
                  <span className="font-medium text-green-700">
                    {summary.totalYachts > 0
                      ? Math.round(((summary.totalYachts - summary.yachtsWithErrors) / summary.totalYachts) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${summary.totalYachts > 0 ? ((summary.totalYachts - summary.yachtsWithErrors) / summary.totalYachts) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Clean yachts (no issues)</span>
                  <span className="font-medium text-green-700">
                    {summary.totalYachts > 0 ? Math.round((summary.yachtsClean / summary.totalYachts) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${summary.totalYachts > 0 ? (summary.yachtsClean / summary.totalYachts) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Yachts with Issues */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Yachts with Issues ({yachtsWithIssues.length})
          </h2>
          {yachtsWithIssues.length === 0 ? (
            <p className="text-gray-500 text-center py-8">All yacht specs pass validation!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warnings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yachtsWithIssues.slice(0, 100).map((yacht) => (
                    <tr key={yacht.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{yacht.modelName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{yacht.manufacturer}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{yacht.year ?? '—'}</td>
                      <td className="px-4 py-3">
                        {yacht.issueCount.error > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                            {yacht.issueCount.error}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {yacht.issueCount.warning > 0 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">
                            {yacht.issueCount.warning}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <details className="cursor-pointer">
                          <summary className="text-sm text-blue-600 hover:text-blue-800">
                            {yacht.issues.length} issue{yacht.issues.length !== 1 ? 's' : ''}
                          </summary>
                          <div className="mt-2 ml-2 space-y-1 max-w-md">
                            {yacht.issues.map((issue, i) => (
                              <IssueRow key={i} issue={issue} />
                            ))}
                          </div>
                        </details>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/admin/yachts/${yacht.id}`}
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
              {yachtsWithIssues.length > 100 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Showing first 100 of {yachtsWithIssues.length} yachts with issues
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
