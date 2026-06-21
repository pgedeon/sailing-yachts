import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import EditReviewForm from './EditReviewForm'

export const dynamic = 'force-dynamic'

export default async function AdminEditReviewPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  await requireAdmin()

  const { id } = params
  let review: any = null
  let yachts: any[] = []
  let fetchError: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'

    const [reviewRes, yachtsRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/reviews/${id}`, {
        cache: 'no-store',
        headers: { cookie: headersList.get('cookie') ?? '' },
      }),
      fetch(`${baseUrl}/api/admin/yachts`, {
        cache: 'no-store',
        headers: { cookie: headersList.get('cookie') ?? '' },
      }),
    ])

    if (!reviewRes.ok) {
      if (reviewRes.status === 404) {
        notFound()
      }
      throw new Error('Failed to fetch review')
    }

    if (!yachtsRes.ok) {
      throw new Error('Failed to fetch yachts')
    }

    const reviewData = await reviewRes.json()
    review = reviewData.review

    const yachtsData = await yachtsRes.json()
    yachts = yachtsData.yachts ?? []
  } catch (error) {
    console.error('Failed to fetch data:', error)
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Review</h1>
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
          ) : review ? (
            <EditReviewForm review={review} yachts={yachts} />
          ) : (
            <p className="text-gray-500">Review not found</p>
          )}
        </div>
      </div>
    </div>
  )
}
