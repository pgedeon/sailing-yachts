'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface YachtData {
  id: number
  modelName: string
  manufacturer?: { id: number; name: string }
  year?: number
  lengthOverall?: number
  beam?: number
  draft?: number
  displacement?: number
  ballast?: number
  sailAreaMain?: number
  rigType?: string
  keelType?: string
  hullMaterial?: string
  cabins?: number
  berths?: number
  heads?: number
  maxOccupancy?: number
  engineHp?: number
  engineType?: string
  fuelCapacity?: number
  waterCapacity?: number
  designNotes?: string
  description?: string
  slug?: string
}

export default function EditYachtPage() {
  const params = useParams()
  const router = useRouter()
  const yachtId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yacht, setYacht] = useState<YachtData | null>(null)

  useEffect(() => {
    fetchYacht()
  }, [yachtId])

  async function fetchYacht() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/yachts/${yachtId}`, { credentials: 'include' })
      if (!res.ok) {
        throw Error('Yacht not found')
      }
      const data = await res.json()
      setYacht(data.yacht)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!yacht) return

    setSubmitting(true)
    setError(null)

    try {
      const payload = {
        manufacturerId: yacht.manufacturer?.id,
        modelName: yacht.modelName,
        year: yacht.year,
        slug: yacht.slug,
        lengthOverall: yacht.lengthOverall,
        beam: yacht.beam,
        draft: yacht.draft,
        displacement: yacht.displacement,
        ballast: yacht.ballast,
        sailAreaMain: yacht.sailAreaMain,
        rigType: yacht.rigType,
        keelType: yacht.keelType,
        hullMaterial: yacht.hullMaterial,
        cabins: yacht.cabins,
        berths: yacht.berths,
        heads: yacht.heads,
        maxOccupancy: yacht.maxOccupancy,
        engineHp: yacht.engineHp,
        engineType: yacht.engineType,
        fuelCapacity: yacht.fuelCapacity,
        waterCapacity: yacht.waterCapacity,
        designNotes: yacht.designNotes,
        description: yacht.description,
      }

      const res = await fetch(`/api/admin/yachts/${yachtId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update yacht')
      }

      router.push('/admin/yachts')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setYacht(prev => prev ? { ...prev, [name]: value } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <p>Loading yacht...</p>
        </div>
      </div>
    )
  }

  if (!yacht) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Yacht not found
          </div>
          <Link href="/admin/yachts" className="text-blue-600 hover:underline">Back to yachts</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/yachts"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            ← Back to Yachts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Yacht</h1>
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
                <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                <input
                  type="text"
                  id="modelName"
                  name="modelName"
                  required
                  value={yacht.modelName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={yacht.year ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="lengthOverall" className="block text-sm font-medium text-gray-700 mb-1">Length Overall (m)</label>
                <input
                  type="number"
                  step="0.1"
                  id="lengthOverall"
                  name="lengthOverall"
                  value={yacht.lengthOverall ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="beam" className="block text-sm font-medium text-gray-700 mb-1">Beam (m)</label>
                <input
                  type="number"
                  step="0.1"
                  id="beam"
                  name="beam"
                  value={yacht.beam ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="draft" className="block text-sm font-medium text-gray-700 mb-1">Draft (m)</label>
                <input
                  type="number"
                  step="0.1"
                  id="draft"
                  name="draft"
                  value={yacht.draft ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="displacement" className="block text-sm font-medium text-gray-700 mb-1">Displacement (kg)</label>
                <input
                  type="number"
                  id="displacement"
                  name="displacement"
                  value={yacht.displacement ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ballast" className="block text-sm font-medium text-gray-700 mb-1">Ballast (kg)</label>
                <input
                  type="number"
                  id="ballast"
                  name="ballast"
                  value={yacht.ballast ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sailAreaMain" className="block text-sm font-medium text-gray-700 mb-1">Main Sail Area (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  id="sailAreaMain"
                  name="sailAreaMain"
                  value={yacht.sailAreaMain ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="rigType" className="block text-sm font-medium text-gray-700 mb-1">Rig Type</label>
                <input
                  type="text"
                  id="rigType"
                  name="rigType"
                  value={yacht.rigType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="keelType" className="block text-sm font-medium text-gray-700 mb-1">Keel Type</label>
                <input
                  type="text"
                  id="keelType"
                  name="keelType"
                  value={yacht.keelType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="hullMaterial" className="block text-sm font-medium text-gray-700 mb-1">Hull Material</label>
                <input
                  type="text"
                  id="hullMaterial"
                  name="hullMaterial"
                  value={yacht.hullMaterial || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cabins" className="block text-sm font-medium text-gray-700 mb-1">Cabins</label>
                <input
                  type="number"
                  id="cabins"
                  name="cabins"
                  value={yacht.cabins ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="berths" className="block text-sm font-medium text-gray-700 mb-1">Berths</label>
                <input
                  type="number"
                  id="berths"
                  name="berths"
                  value={yacht.berths ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="heads" className="block text-sm font-medium text-gray-700 mb-1">Heads</label>
                <input
                  type="number"
                  id="heads"
                  name="heads"
                  value={yacht.heads ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="maxOccupancy" className="block text-sm font-medium text-gray-700 mb-1">Max Occupancy</label>
                <input
                  type="number"
                  id="maxOccupancy"
                  name="maxOccupancy"
                  value={yacht.maxOccupancy ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="engineHp" className="block text-sm font-medium text-gray-700 mb-1">Engine HP</label>
                <input
                  type="number"
                  id="engineHp"
                  name="engineHp"
                  value={yacht.engineHp ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="engineType" className="block text-sm font-medium text-gray-700 mb-1">Engine Type</label>
                <input
                  type="text"
                  id="engineType"
                  name="engineType"
                  value={yacht.engineType || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fuelCapacity" className="block text-sm font-medium text-gray-700 mb-1">Fuel Capacity (L)</label>
                <input
                  type="number"
                  id="fuelCapacity"
                  name="fuelCapacity"
                  value={yacht.fuelCapacity ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="waterCapacity" className="block text-sm font-medium text-gray-700 mb-1">Water Capacity (L)</label>
                <input
                  type="number"
                  id="waterCapacity"
                  name="waterCapacity"
                  value={yacht.waterCapacity ?? ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="designNotes" className="block text-sm font-medium text-gray-700 mb-1">Design Notes</label>
              <textarea
                id="designNotes"
                name="designNotes"
                rows={4}
                value={yacht.designNotes || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={yacht.description || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link
                href="/admin/yachts"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Yacht'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
