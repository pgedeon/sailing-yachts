'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Yacht {
  id: number
  modelName: string
  manufacturer?: string
  year?: number
}

interface ReviewSource {
  id: number
  name: string
  sourceType: string
}

interface NewReviewFormProps {
  yachts: Yacht[]
  reviewSources?: ReviewSource[]
}

export default function NewReviewForm({ yachts, reviewSources = [] }: NewReviewFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      reviewSourceId: formData.get('reviewSourceId') ? parseInt(formData.get('reviewSourceId') as string, 10) : null,
    }

    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to create review' }))
        throw new Error(errorData.error || 'Failed to create review')
      }

      router.push('/admin/reviews')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
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

      {reviewSources.length > 0 && (
        <div>
          <label htmlFor="reviewSourceId" className="block text-sm font-medium text-gray-700 mb-1">
            Review Source (linked)
          </label>
          <select
            id="reviewSourceId"
            name="reviewSourceId"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">— None —</option>
            {reviewSources.map((rs) => (
              <option key={rs.id} value={rs.id}>{rs.name} ({rs.sourceType})</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
            Source <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="source"
            name="source"
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
          {submitting ? 'Creating...' : 'Create Review'}
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
