import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ReviewsTable } from './ReviewsTable'

export const dynamic = 'force-dynamic'

export default async function AdminReviewsPage() {
  await requireAdmin()

  let reviews: any[] = []
  let fetchError: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/reviews`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null)
      throw new Error(errorBody?.error || 'Failed to fetch reviews')
    }
    const data = await res.json()
    reviews = data.reviews ?? []
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Reviews</h1>
          <div className="flex gap-3">
            <Link href="/admin/reviews/new" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200">Add Review</Link>
            <Link href="/admin" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200">Back to Dashboard</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reviews List</h2>

          {fetchError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {fetchError}</span>
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No reviews found.{' '}
              <Link href="/admin/reviews/new" className="text-blue-600 hover:underline">Add one</Link>
            </p>
          ) : (
            <ReviewsTable reviews={reviews} />
          )}
        </div>
      </div>
    </div>
  )
}
