'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Review {
  id: number
  manufacturerName: string | null
  yachtModelName: string | null
  source: string | null
  rating: number | null
  summary: string | null
  reviewDate: string | null
}

export function ReviewsTable({ reviews }: { reviews: Review[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<number | null>(null)

  async function handleDelete(id: number) {
    if (!confirm('Delete this review?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
      else alert('Failed to delete review')
    } catch {
      alert('Failed to delete review')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yacht</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {reviews.map((review) => (
            <tr key={review.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                {review.manufacturerName} {review.yachtModelName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {review.source || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {review.rating !== null ? `${review.rating.toFixed(1)}/10` : '—'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                {review.summary || '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {review.reviewDate ? new Date(review.reviewDate).toLocaleDateString() : '—'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                <Link href={`/admin/reviews/${review.id}/edit`} prefetch={false} className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs bg-blue-50">Edit</Link>
                <button onClick={() => handleDelete(review.id)} disabled={deleting === review.id} className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-xs bg-red-50 disabled:opacity-50">
                  {deleting === review.id ? 'Deleting...' : 'Delete'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
