'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SpecCategoryData {
  id: number
  name: string
  unit?: string
  dataType: string
  categoryGroup?: string
  isFilterable: boolean
  description?: string
}

export default function EditSpecCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [category, setCategory] = useState<SpecCategoryData | null>(null)

  useEffect(() => {
    fetchCategory()
  }, [categoryId])

  async function fetchCategory() {
    try {
      setLoading(true)
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sailing-yachts.vercel.app'
      const res = await fetch(`${baseUrl}/api/admin/spec-categories/${categoryId}`)
      if (!res.ok) {
        throw new Error('Category not found')
      }
      const data = await res.json()
      setCategory(data.category)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return

    setSubmitting(true)
    setError(null)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sailing-yachts.vercel.app'
      const payload = {
        name: category.name,
        unit: category.unit,
        dataType: category.dataType,
        categoryGroup: category.categoryGroup,
        isFilterable: category.isFilterable,
        description: category.description,
      }

      const res = await fetch(`${baseUrl}/api/admin/spec-categories/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update spec category')
      }

      router.push('/admin/spec-categories')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setCategory(prev => prev ? { 
      ...prev, 
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value 
    } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading category...</p>
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Category not found
          </div>
          <Link href="/admin/spec-categories" className="text-blue-600 hover:underline">Back to categories</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/spec-categories"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            ← Back to Categories
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Spec Category</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={category.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  id="unit"
                  name="unit"
                  value={category.unit || ''}
                  onChange={handleChange}
                  placeholder="e.g., m, kg, m²"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">Data Type *</label>
                <select
                  id="dataType"
                  name="dataType"
                  value={category.dataType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="numeric">Numeric</option>
                  <option value="text">Text</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div>
                <label htmlFor="categoryGroup" className="block text-sm font-medium text-gray-700 mb-1">Category Group</label>
                <input
                  type="text"
                  id="categoryGroup"
                  name="categoryGroup"
                  value={category.categoryGroup || ''}
                  onChange={handleChange}
                  placeholder="e.g., Construction, Rigging, Technical"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isFilterable"
                    checked={category.isFilterable}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Filterable</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={category.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link
                href="/admin/spec-categories"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}