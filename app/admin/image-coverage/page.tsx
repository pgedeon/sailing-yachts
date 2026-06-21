import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface YachtCoverageEntry {
  id: number
  model_name: string
  manufacturer_name: string
  slug: string | null
  year: number | null
  has_images: boolean
  image_count: number
  media_asset_count: number
}

interface CoverageStats {
  totalYachts: number
  yachtsWithImages: number
  yachtsWithoutImages: number
  totalImages: number
  totalMediaAssets: number
  coverageRate: number
  manufacturerStats: Record<string, { total: number; withImages: number; withoutImages: number }>
}

export default async function AdminImageCoveragePage() {
  await requireAdmin()

  let stats: CoverageStats | null = null
  let needsAttention: YachtCoverageEntry[] = []
  let fetchError: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/image-coverage`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) throw new Error('Failed to fetch image coverage data')
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Image Coverage Audit</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Total Yachts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalYachts}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">With Images</p>
            <p className="text-3xl font-bold text-green-600">{stats.yachtsWithImages}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Without Images</p>
            <p className="text-3xl font-bold text-red-600">{stats.yachtsWithoutImages}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Coverage Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.coverageRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <p className="text-sm font-medium text-gray-500">Total Assets</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalImages + stats.totalMediaAssets}</p>
          </div>
        </div>

        {/* Manufacturer Coverage */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Manufacturer Coverage</h2>
          <div className="space-y-4">
            {Object.entries(stats.manufacturerStats).map(([manufacturer, data]) => {
              const coverageRate = data.total > 0 ? Math.round((data.withImages / data.total) * 100) : 0
              return (
                <div key={manufacturer}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 font-medium">{manufacturer}</span>
                    <span className="text-gray-600">
                      {data.withImages}/{data.total} ({coverageRate}%)
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        coverageRate >= 80 ? 'bg-green-500' :
                        coverageRate >= 60 ? 'bg-blue-500' :
                        coverageRate >= 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${coverageRate}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Yachts Without Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Yachts Missing Images
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Media Assets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {needsAttention.map((yacht) => (
                  <tr key={yacht.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{yacht.model_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{yacht.manufacturer_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{yacht.year ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        yacht.image_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {yacht.image_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        yacht.media_asset_count > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {yacht.media_asset_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <Link
                        href={`/admin/yachts/${yacht.id}/edit`}
                        prefetch={false}
                        className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs bg-blue-50"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/yachts/${yacht.id}/images`}
                        prefetch={false}
                        className="text-green-600 hover:text-green-800 px-2 py-1 rounded text-xs bg-green-50"
                      >
                        Add Images
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {needsAttention.length === 0 && (
            <p className="text-gray-500 text-center py-8">All yachts have images!</p>
          )}
        </div>
      </div>
    </div>
  )
}