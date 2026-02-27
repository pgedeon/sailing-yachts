'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewYachtPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manufacturers, setManufacturers] = useState<{ id: number; name: string }[]>([])
  const [formData, setFormData] = useState({
    modelName: '',
    manufacturerId: '',
    year: '',
    slug: '',
    lengthOverall: '',
    beam: '',
    draft: '',
    displacement: '',
    ballast: '',
    sailAreaMain: '',
    rigType: '',
    keelType: '',
    hullMaterial: '',
    cabins: '',
    berths: '',
    heads: '',
    maxOccupancy: '',
    engineHp: '',
    engineType: '',
    fuelCapacity: '',
    waterCapacity: '',
    designNotes: '',
    description: '',
  })

  // Fetch manufacturers on mount (useEffect, not useState)
  useEffect(() => {
    fetchManufacturers()
  }, [])

  async function fetchManufacturers() {
    try {
      const res = await fetch('/api/manufacturers')
      if (res.ok) {
        const data = await res.json()
        setManufacturers(data.manufacturers || [])
      }
    } catch (err) {
      console.error('Failed to fetch manufacturers:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        manufacturerId: formData.manufacturerId ? parseInt(formData.manufacturerId) : undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        lengthOverall: formData.lengthOverall ? parseFloat(formData.lengthOverall) : undefined,
        beam: formData.beam ? parseFloat(formData.beam) : undefined,
        draft: formData.draft ? parseFloat(formData.draft) : undefined,
        displacement: formData.displacement ? parseFloat(formData.displacement) : undefined,
        ballast: formData.ballast ? parseFloat(formData.ballast) : undefined,
        sailAreaMain: formData.sailAreaMain ? parseFloat(formData.sailAreaMain) : undefined,
        cabins: formData.cabins ? parseInt(formData.cabins) : undefined,
        berths: formData.berths ? parseInt(formData.berths) : undefined,
        heads: formData.heads ? parseInt(formData.heads) : undefined,
        maxOccupancy: formData.maxOccupancy ? parseInt(formData.maxOccupancy) : undefined,
        engineHp: formData.engineHp ? parseFloat(formData.engineHp) : undefined,
        fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined,
        waterCapacity: formData.waterCapacity ? parseFloat(formData.waterCapacity) : undefined,
      }

      const res = await fetch('/api/admin/yachts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create yacht')
      }

      router.push('/admin/yachts')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-generate slug from model name
    if (name === 'modelName' && !formData.slug) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[\w-]/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin/yachts"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            ← Back to Yachts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Yacht</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div>
                <label htmlFor="modelName" className="block text-sm font-medium text-gray-700 mb-1">Model Name *</label>
                <input
                  type="text"
                  id="modelName"
                  name="modelName"
                  required
                  value={formData.modelName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="manufacturerId" className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
                <select
                  id="manufacturerId"
                  name="manufacturerId"
                  required
                  value={formData.manufacturerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a manufacturer</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  required
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">Slug (auto-generated)</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label htmlFor="lengthOverall" className="block text-sm font-medium text-gray-700 mb-1">Length Overall (m)</label>
                <input
                  type="number"
                  step="0.01"
                  id="lengthOverall"
                  name="lengthOverall"
                  value={formData.lengthOverall}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="beam" className="block text-sm font-medium text-gray-700 mb-1">Beam (m)</label>
                <input
                  type="number"
                  step="0.01"
                  id="beam"
                  name="beam"
                  value={formData.beam}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="draft" className="block text-sm font-medium text-gray-700 mb-1">Draft (m)</label>
                <input
                  type="number"
                  step="0.01"
                  id="draft"
                  name="draft"
                  value={formData.draft}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="displacement" className="block text-sm font-medium text-gray-700 mb-1">Displacement (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  id="displacement"
                  name="displacement"
                  value={formData.displacement}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="ballast" className="block text-sm font-medium text-gray-700 mb-1">Ballast (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  id="ballast"
                  name="ballast"
                  value={formData.ballast}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="sailAreaMain" className="block text-sm font-medium text-gray-700 mb-1">Sail Area Main (m²)</label>
                <input
                  type="number"
                  step="0.01"
                  id="sailAreaMain"
                  name="sailAreaMain"
                  value={formData.sailAreaMain}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categorical */}
              <div>
                <label htmlFor="rigType" className="block text-sm font-medium text-gray-700 mb-1">Rig Type</label>
                <input
                  type="text"
                  id="rigType"
                  name="rigType"
                  value={formData.rigType}
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
                  value={formData.keelType}
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
                  value={formData.hullMaterial}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Accommodation */}
              <div>
                <label htmlFor="cabins" className="block text-sm font-medium text-gray-700 mb-1">Cabins</label>
                <input
                  type="number"
                  id="cabins"
                  name="cabins"
                  value={formData.cabins}
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
                  value={formData.berths}
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
                  value={formData.heads}
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
                  value={formData.maxOccupancy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Technical */}
              <div>
                <label htmlFor="engineHp" className="block text-sm font-medium text-gray-700 mb-1">Engine HP</label>
                <input
                  type="number"
                  step="0.01"
                  id="engineHp"
                  name="engineHp"
                  value={formData.engineHp}
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
                  value={formData.engineType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="fuelCapacity" className="block text-sm font-medium text-gray-700 mb-1">Fuel Capacity (L)</label>
                <input
                  type="number"
                  step="0.01"
                  id="fuelCapacity"
                  name="fuelCapacity"
                  value={formData.fuelCapacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="waterCapacity" className="block text-sm font-medium text-gray-700 mb-1">Water Capacity (L)</label>
                <input
                  type="number"
                  step="0.01"
                  id="waterCapacity"
                  name="waterCapacity"
                  value={formData.waterCapacity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Full width fields */}
            <div>
              <label htmlFor="designNotes" className="block text-sm font-medium text-gray-700 mb-1">Design Notes</label>
              <textarea
                id="designNotes"
                name="designNotes"
                rows={3}
                value={formData.designNotes}
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
                value={formData.description}
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
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Yacht'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
