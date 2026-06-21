import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminReviewSourcesPage() {
  await requireAdmin()

  let sources: any[] = []
  let errorMsg: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/review-sources`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      throw new Error(errorBody?.error || 'Failed to fetch review sources')
    }
    const data = await res.json()
    sources = data.sources ?? []
  } catch (error) {
    console.error('Failed to fetch review sources:', error)
    errorMsg = error instanceof Error ? error.message : 'Unknown error'
  }

  const sourceTypeLabels: Record<string, string> = {
    magazine: 'Magazine',
    youtube: 'YouTube',
    blog: 'Blog',
    expert: 'Expert',
    forum: 'Forum',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Review Sources</h1>
          <div className="flex gap-3">
            <Link
              href="/admin/review-sources/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Add Source
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{errorMsg}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            External Review Sources ({sources.length})
          </h2>

          {sources.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No review sources yet. Add your first source to start aggregating reviews.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credibility</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reviews</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {sources.map((source: any) => (
                    <tr key={source.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {source.logoUrl && (
                            <img src={source.logoUrl} alt="" className="w-6 h-6 rounded" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{source.name}</div>
                            {source.websiteUrl && (
                              <a href={source.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                                {new URL(source.websiteUrl).hostname}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                          {sourceTypeLabels[source.sourceType] || source.sourceType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                source.credibilityScore >= 70 ? 'bg-green-500' :
                                source.credibilityScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${source.credibilityScore}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{source.credibilityScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{source.reviewCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          source.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {source.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/review-sources/${source.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
