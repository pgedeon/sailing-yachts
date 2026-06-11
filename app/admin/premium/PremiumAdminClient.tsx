'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

interface PremiumDocument {
  title: string
  url: string
  type: string
}

interface Manufacturer {
  id: number
  name: string
  country: string | null
  logoUrl: string | null
  tier: 'free' | 'verified' | 'premium'
  verifiedAt: string | null
  premiumVideoUrl: string | null
  premiumDocuments: PremiumDocument[]
  premiumTagline: string | null
  premiumFeaturedSince: string | null
  premiumCtaText: string | null
  premiumCtaUrl: string | null
  yachtCount: number
}

export default function PremiumAdminClient() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  // Edit form state
  const [editForm, setEditForm] = useState({
    tier: 'free' as string,
    premiumVideoUrl: '',
    premiumTagline: '',
    premiumCtaText: '',
    premiumCtaUrl: '',
    premiumDocuments: [] as PremiumDocument[],
  })
  const [newDoc, setNewDoc] = useState({ title: '', url: '', type: 'brochure' })

  const fetchManufacturers = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/manufacturers/premium', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setManufacturers(data.manufacturers ?? [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchManufacturers() }, [fetchManufacturers])

  async function updateTier(id: number, tier: string) {
    try {
      const res = await fetch('/api/admin/manufacturers/premium', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id,
          tier,
          ...(tier === 'verified' ? { verifiedAt: 'now' } : {}),
          ...(tier === 'premium' ? { verifiedAt: 'now', premiumFeaturedSince: new Date().toISOString() } : {}),
          ...(tier === 'free' ? { verifiedAt: null, premiumVideoUrl: null, premiumTagline: null, premiumDocuments: [], premiumCtaText: null, premiumCtaUrl: null } : {}),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update tier')
      }
      await fetchManufacturers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    }
  }

  function openEditor(m: Manufacturer) {
    setEditingId(m.id)
    setEditForm({
      tier: m.tier,
      premiumVideoUrl: m.premiumVideoUrl || '',
      premiumTagline: m.premiumTagline || '',
      premiumCtaText: m.premiumCtaText || '',
      premiumCtaUrl: m.premiumCtaUrl || '',
      premiumDocuments: m.premiumDocuments || [],
    })
    setNewDoc({ title: '', url: '', type: 'brochure' })
  }

  async function saveEdit() {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/manufacturers/premium', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingId,
          tier: editForm.tier,
          ...(editForm.tier !== 'free' ? { verifiedAt: 'now' } : {}),
          premiumVideoUrl: editForm.premiumVideoUrl || null,
          premiumTagline: editForm.premiumTagline || null,
          premiumCtaText: editForm.premiumCtaText || null,
          premiumCtaUrl: editForm.premiumCtaUrl || null,
          premiumDocuments: editForm.premiumDocuments,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }
      setEditingId(null)
      await fetchManufacturers()
    } catch (err: any) {
      alert(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function addDocument() {
    if (!newDoc.title || !newDoc.url) return
    setEditForm(prev => ({
      ...prev,
      premiumDocuments: [...prev.premiumDocuments, { ...newDoc }],
    }))
    setNewDoc({ title: '', url: '', type: 'brochure' })
  }

  function removeDocument(idx: number) {
    setEditForm(prev => ({
      ...prev,
      premiumDocuments: prev.premiumDocuments.filter((_, i) => i !== idx),
    }))
  }

  const filtered = manufacturers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  const tierStats = {
    premium: manufacturers.filter(m => m.tier === 'premium').length,
    verified: manufacturers.filter(m => m.tier === 'verified').length,
    free: manufacturers.filter(m => m.tier === 'free').length,
  }

  const tierColors: Record<string, string> = {
    premium: 'bg-amber-100 text-amber-800 border-amber-200',
    verified: 'bg-blue-100 text-blue-800 border-blue-200',
    free: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto"><p>Loading premium tiers...</p></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Premium Listing Tiers</h1>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center"><span className="text-lg">⭐</span></div>
              <div><p className="text-2xl font-bold">{tierStats.premium}</p><p className="text-sm text-gray-500">Premium</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-lg">✓</span></div>
              <div><p className="text-2xl font-bold">{tierStats.verified}</p><p className="text-sm text-gray-500">Verified</p></div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><span className="text-lg">○</span></div>
              <div><p className="text-2xl font-bold">{tierStats.free}</p><p className="text-sm text-gray-500">Free</p></div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search manufacturers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Manufacturers list */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Manufacturers ({filtered.length})</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map(m => (
              <div key={m.id} className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{m.name}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tierColors[m.tier]}`}>
                        {m.tier === 'premium' ? '⭐ Premium' : m.tier === 'verified' ? '✓ Verified' : '○ Free'}
                      </span>
                      {m.country && <span className="text-sm text-gray-400">{m.country}</span>}
                      <span className="text-xs text-gray-400">{m.yachtCount} yachts</span>
                    </div>
                    {m.premiumTagline && <p className="mt-1 text-sm text-gray-500 truncate">{m.premiumTagline}</p>}
                    <div className="flex gap-3 mt-1">
                      {m.premiumVideoUrl && <span className="text-xs text-sky-600">🎬 Video</span>}
                      {m.premiumDocuments && m.premiumDocuments.length > 0 && <span className="text-xs text-sky-600">📄 {m.premiumDocuments.length} doc(s)</span>}
                      {m.premiumCtaText && <span className="text-xs text-sky-600">🔗 CTA</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={m.tier}
                      onChange={e => updateTier(m.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1.5 bg-white"
                    >
                      <option value="free">Free</option>
                      <option value="verified">Verified</option>
                      <option value="premium">Premium</option>
                    </select>
                    <button
                      onClick={() => openEditor(m)}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                    >
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Configure {manufacturers.find(m => m.id === editingId)?.name}
                </h3>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Tier selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                  <select
                    value={editForm.tier}
                    onChange={e => setEditForm(prev => ({ ...prev, tier: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="free">Free</option>
                    <option value="verified">Verified</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                {editForm.tier === 'premium' && (
                  <>
                    {/* Video URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Promotional Video URL</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/embed/..."
                        value={editForm.premiumVideoUrl}
                        onChange={e => setEditForm(prev => ({ ...prev, premiumVideoUrl: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                      <p className="mt-1 text-xs text-gray-400">YouTube/Vimeo embed URL for manufacturer profile video</p>
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Premium Tagline</label>
                      <input
                        type="text"
                        placeholder="World-renowned craftsmanship since 1965"
                        value={editForm.premiumTagline}
                        onChange={e => setEditForm(prev => ({ ...prev, premiumTagline: e.target.value }))}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    {/* Documents */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documents & Brochures</label>
                      <div className="space-y-2">
                        {editForm.premiumDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{doc.type}</span>
                            <span className="text-sm flex-1 truncate">{doc.title}</span>
                            <button onClick={() => removeDocument(idx)} className="text-red-500 text-xs hover:text-red-700">Remove</button>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Title"
                          value={newDoc.title}
                          onChange={e => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <input
                          type="url"
                          placeholder="URL"
                          value={newDoc.url}
                          onChange={e => setNewDoc(prev => ({ ...prev, url: e.target.value }))}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <select
                          value={newDoc.type}
                          onChange={e => setNewDoc(prev => ({ ...prev, type: e.target.value }))}
                          className="px-2 py-1 text-sm border border-gray-300 rounded"
                        >
                          <option value="brochure">Brochure</option>
                          <option value="spec_sheet">Spec Sheet</option>
                          <option value="catalog">Catalog</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={addDocument}
                          disabled={!newDoc.title || !newDoc.url}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          placeholder="Request a Quote"
                          value={editForm.premiumCtaText}
                          onChange={e => setEditForm(prev => ({ ...prev, premiumCtaText: e.target.value }))}
                          maxLength={200}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={editForm.premiumCtaUrl}
                          onChange={e => setEditForm(prev => ({ ...prev, premiumCtaUrl: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}

                {editForm.tier === 'verified' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <strong>Verified tier:</strong> The manufacturer will receive a verified badge (✓) on their profile page. No premium content features.
                  </div>
                )}

                {editForm.tier === 'free' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                    <strong>Free tier:</strong> Standard listing. Premium content will be hidden from the public profile.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
