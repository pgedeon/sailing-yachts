'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Yacht {
  id: number
  modelName: string
  manufacturer?: string
  year?: number
}

interface Review {
  id: number
  yachtModelId: number
  source: string
  rating: number | null
  summary: string | null
  fullText: string | null
  reviewDate: string | null
  authorName: string | null
  sourceUrl: string | null
}

interface EditReviewFormProps {
  review: Review
  yachts: Yacht[]
}

export default function EditReviewForm({ review: initialReview, yachts }: EditReviewFormProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [review, setReview] = useState<Review>(initialReview)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setReview((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      yachtModelId: parseInt(formData.get('yachtModelId') as string, 10),
      source: formData.get('source') as string,
      rating: formData.get('rating') ? parseFloat(formData.get('rating') as string) : null,
      summary: formData.get('summary') as string || null,
      fullText: formData.get('fullText') as string || null,
      reviewDate: formData.get('reviewDate') as string || null,
      authorName: formData.get('authorName') as string || null,
      sourceUrl: formData.get('sourceUrl') as string || null,
    }

    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update review' }))
        throw new Error(errorData.error || 'Failed to update review')
      }

      router.push('/admin/reviews')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }

  // Format date for date input (YYYY-MM-DD)
  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return ''
    return new Date(dateStr).toISOString().split('T')[0]
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div>
        <label htmlFor="yachtModelId" className="block text-sm font-medium text-gray-700 mb-1">
          Yacht Model <span className="text-red-500">*</span>
        </label>
        <select
          id="yachtModelId"
          name="yachtModelId"
          value={review.yachtModelId}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a yacht...</option>
          {yachts.map((yacht) => (
            <option key={yacht.id} value={yacht.id}>
              {yacht.manufacturer || 'Unknown'} {yacht.modelName}
              {yacht.year ? ` (${yacht.year})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="source"
            name="source"
            value={review.source || ''}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="e.g., Sail Magazine, Practical Boat Owner"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
            Rating (0-10)
          </label>
          <input
            type="number"
            id="rating"
            name="rating"
            value={review.rating !== null && review.rating !== undefined ? review.rating : ''}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.1"
            placeholder="e.g., 8.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 mb-1">
          Author Name
        </label>
        <input
          type="text"
          id="authorName"
          name="authorName"
          value={review.authorName || ''}
          onChange={handleChange}
          maxLength={200}
          placeholder="e.g., John Smith"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="reviewDate" className="block text-sm font-medium text-gray-700 mb-1">
          Review Date
        </label>
        <input
          type="date"
          id="reviewDate"
          name="reviewDate"
          value={formatDateForInput(review.reviewDate)}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          value={review.summary || ''}
          onChange={handleChange}
          maxLength={500}
          rows={2}
          placeholder="Brief summary of the review"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="fullText" className="block text-sm font-medium text-gray-700 mb-1">
          Full Review Text
        </label>
        <textarea
          id="fullText"
          name="fullText"
          value={review.fullText || ''}
          onChange={handleChange}
          maxLength={50000}
          rows={10}
          placeholder="Complete review text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="sourceUrl" className="block text-sm font-medium text-gray-700 mb-1">
          Source URL
        </label>
        <input
          type="url"
          id="sourceUrl"
          name="sourceUrl"
          value={review.sourceUrl || ''}
          onChange={handleChange}
          maxLength={500}
          placeholder="https://example.com/review"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitting ? 'Updating...' : 'Update Review'}
        </button>
        <Link
          href="/admin/reviews"
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition duration-200"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
