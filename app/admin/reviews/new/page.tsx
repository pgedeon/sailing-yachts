import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import NewReviewForm from './NewReviewForm'

export const dynamic = 'force-dynamic'

export default async function AdminNewReviewPage() {
  await requireAdmin()

  let yachts: any[] = []
  let reviewSources: any[] = []
  let fetchError: string | null = null

  try {
    const headersList = headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/yachts`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      throw new Error(errorBody?.error || 'Failed to fetch yachts')
    }
    const data = await res.json()
    yachts = data.yachts ?? []

    // Fetch review sources
    const rsRes = await fetch(`${baseUrl}/api/admin/review-sources`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (rsRes.ok) {
      const rsData = await rsRes.json()
      reviewSources = rsData.sources ?? []
    }
  } catch (error) {
    console.error('Failed to fetch yachts:', error)
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Review</h1>
          <Link
            href="/admin/reviews"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Reviews
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Review Details</h2>

          {fetchError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {fetchError}</span>
            </div>
          ) : yachts.length === 0 ? (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Warning!</strong>
              <span className="block sm:inline"> No yachts found. Add some yachts first.</span>
            </div>
          ) : (
            <NewReviewForm yachts={yachts} reviewSources={reviewSources} />
          )}
        </div>
      </div>
    </div>
  )
}
