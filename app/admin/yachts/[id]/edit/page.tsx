'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
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

interface ImageData {
  id: number
  url: string
  caption?: string
  altText?: string
  isPrimary: boolean
  sortOrder: number
}

export default function EditYachtPage() {
  const params = useParams()
  const router = useRouter()
  const yachtId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [yacht, setYacht] = useState<YachtData | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)

  // Refs for form elements
  const imageUrlRef = useRef<HTMLInputElement>(null)
  const imageCaptionRef = useRef<HTMLInputElement>(null)
  const imageAltTextRef = useRef<HTMLInputElement>(null)
  const isPrimaryRef = useRef<HTMLInputElement>(null)
  const sortOrderRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchYacht()
    fetchImages()
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

  async function fetchImages() {
    try {
      const res = await fetch(`/api/admin/yachts/${yachtId}/images`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images)
      }
    } catch (err: any) {
      console.error('Failed to fetch images:', err)
    }
  }

  async function handleImageUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedFile && (!imageUrlRef.current || !imageUrlRef.current.value)) {
      setError('Please select a file or enter an image URL')
      return
    }

    setUploadingImage(true)
    setError(null)

    try {
      const formData = new FormData()
      if (selectedFile) {
        formData.append('image', selectedFile)
      }
      
      const imageUrl = imageUrlRef.current?.value
      if (imageUrl) {
        formData.append('url', imageUrl)
      }
      
      const caption = imageCaptionRef.current?.value
      if (caption) {
        formData.append('caption', caption)
      }
      
      const altText = imageAltTextRef.current?.value
      if (altText) {
        formData.append('altText', altText)
      }
      
      const isPrimary = isPrimaryRef.current?.checked
      if (isPrimary) {
        formData.append('isPrimary', 'true')
      }
      
      const sortOrder = sortOrderRef.current?.value
      if (sortOrder) {
        formData.append('sortOrder', sortOrder)
      }

      const res = await fetch(`/api/admin/yachts/${yachtId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }

      // Reset form
      setSelectedFile(null)
      if (imageUrlRef.current) {
        imageUrlRef.current.value = ''
      }
      if (imageCaptionRef.current) {
        imageCaptionRef.current.value = ''
      }
      if (imageAltTextRef.current) {
        imageAltTextRef.current.value = ''
      }
      if (isPrimaryRef.current) {
        isPrimaryRef.current.checked = false
      }
      if (sortOrderRef.current) {
        sortOrderRef.current.value = '0'
      }
      
      setShowImageUpload(false)
      await fetchImages()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleDeleteImage(imageId: number) {
    if (!confirm('Are you sure you want to delete this image?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/yachts/${yachtId}/images?imageId=${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error('Failed to delete image')
      }

      await fetchImages()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleSetPrimaryImage(imageId: number) {
    try {
      // Update the primary image flag
      const res = await fetch(`/api/admin/yachts/${yachtId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageId,
          isPrimary: true
        }),
        credentials: 'include'
      })

      if (!res.ok) {
        throw new Error('Failed to set primary image')
      }

      await fetchImages()
    } catch (err: any) {
      setError(err.message)
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setYacht(prev => prev ? { ...prev, [name]: value } : null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
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
      <div className="max-w-4xl mx-auto">
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

          <div className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
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
              </form>
            </div>

            {/* Image Management */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Images</h2>
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                >
                  {showImageUpload ? 'Cancel' : 'Add Image'}
                </button>
              </div>

              {/* Image Upload Form */}
              {showImageUpload && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Upload New Image</h3>
                  <form onSubmit={handleImageUpload} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image File (or enter URL below)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
                    </div>

                    <div>
                      <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">Or Image URL</label>
                      <input
                        ref={imageUrlRef}
                        type="url"
                        id="imageUrl"
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="imageCaption" className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                      <input
                        ref={imageCaptionRef}
                        type="text"
                        id="imageCaption"
                        placeholder="Image caption"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="imageAltText" className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                      <input
                        ref={imageAltTextRef}
                        type="text"
                        id="imageAltText"
                        placeholder="Alternative text for accessibility"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          ref={isPrimaryRef}
                          type="checkbox"
                          id="isPrimary"
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Set as primary image</span>
                      </label>

                      <div>
                        <label htmlFor="sortOrder" className="text-sm font-medium text-gray-700">Sort Order</label>
                        <input
                          ref={sortOrderRef}
                          type="number"
                          id="sortOrder"
                          defaultValue="0"
                          min="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowImageUpload(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingImage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Image List */}
              {images.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={image.id} className="border border-gray-200 rounded-md overflow-hidden">
                        <div className="relative">
                          <Image
                            src={image.url}
                            alt={image.altText || `Yacht image ${index + 1}`}
                            width={400}
                            height={192}
                            className="w-full h-48 object-cover"
                          />
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          {image.caption && (
                            <p className="text-sm text-gray-600 mb-2">{image.caption}</p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">Order: {image.sortOrder}</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSetPrimaryImage(image.id)}
                                disabled={image.isPrimary}
                                className={`text-xs px-2 py-1 rounded ${
                                  image.isPrimary
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                              >
                                Primary
                              </button>
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Link
                href="/admin/yachts"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                form="yacht-form"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Yacht'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}