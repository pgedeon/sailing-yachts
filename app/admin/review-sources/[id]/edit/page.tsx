import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getReviewSource(id: number) {
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const proto = headersList.get('x-forwarded-proto') ?? 'http'
  const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/admin/review-sources/${id}`, {
    cache: 'no-store',
    headers: { cookie: headersList.get('cookie') ?? '' },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.source
}

export default async function EditReviewSourcePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const numId = parseInt(id, 10)
  const source = await getReviewSource(numId)

  if (!source) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <p className="text-red-600">Review source not found.</p>
          <Link href="/admin/review-sources" className="text-blue-600 hover:underline mt-4 inline-block">Back to Review Sources</Link>
        </div>
      </div>
    )
  }

  async function updateSource(formData: FormData) {
    'use server'
    const { pool } = await import('@/lib/db')
    const { revalidatePath } = await import('next/cache')

    const name = (formData.get('name') as string)?.trim()
    if (!name) throw new Error('Name is required')

    await pool.query(
      `UPDATE review_sources SET
        name = $1, website_url = $2, logo_url = $3, description = $4,
        credibility_score = $5, source_type = $6, is_active = $7, updated_at = NOW()
       WHERE id = $8`,
      [
        name,
        (formData.get('websiteUrl') as string)?.trim() || null,
        (formData.get('logoUrl') as string)?.trim() || null,
        (formData.get('description') as string)?.trim() || null,
        Math.min(100, Math.max(0, Number(formData.get('credibilityScore')) || 50)),
        (formData.get('sourceType') as string) || 'magazine',
        formData.get('isActive') === 'on',
        numId,
      ]
    )

    revalidatePath('/admin/review-sources')
    redirect('/admin/review-sources')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Review Source: {source.name}</h1>
        <form action={updateSource} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" type="text" required defaultValue={source.name} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
            <select name="sourceType" defaultValue={source.sourceType} className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="magazine">Magazine</option>
              <option value="youtube">YouTube</option>
              <option value="blog">Blog</option>
              <option value="expert">Expert</option>
              <option value="forum">Forum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input name="websiteUrl" type="url" defaultValue={source.websiteUrl || ''} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input name="logoUrl" type="url" defaultValue={source.logoUrl || ''} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={3} defaultValue={source.description || ''} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credibility Score (0-100)</label>
            <input name="credibilityScore" type="number" min={0} max={100} defaultValue={source.credibilityScore} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="flex items-center gap-2">
            <input name="isActive" type="checkbox" id="isActive" defaultChecked={source.isActive} className="rounded border-gray-300" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
            <Link href="/admin/review-sources" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
