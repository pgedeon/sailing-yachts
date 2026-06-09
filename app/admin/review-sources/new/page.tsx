import { requireAdmin } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function NewReviewSourcePage() {
  await requireAdmin()

  async function createSource(formData: FormData) {
    'use server'
    const { pool } = await import('@/lib/db')
    const { revalidatePath } = await import('next/cache')

    const name = (formData.get('name') as string)?.trim()
    if (!name) throw new Error('Name is required')

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    await pool.query(
      `INSERT INTO review_sources (name, slug, website_url, logo_url, description, credibility_score, source_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        name,
        slug,
        (formData.get('websiteUrl') as string)?.trim() || null,
        (formData.get('logoUrl') as string)?.trim() || null,
        (formData.get('description') as string)?.trim() || null,
        Math.min(100, Math.max(0, Number(formData.get('credibilityScore')) || 50)),
        (formData.get('sourceType') as string) || 'magazine',
      ]
    )

    revalidatePath('/admin/review-sources')
    redirect('/admin/review-sources')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Review Source</h1>
        <form action={createSource} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" type="text" required className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Yachting World" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Type</label>
            <select name="sourceType" className="w-full border border-gray-300 rounded-md px-3 py-2">
              <option value="magazine">Magazine</option>
              <option value="youtube">YouTube</option>
              <option value="blog">Blog</option>
              <option value="expert">Expert</option>
              <option value="forum">Forum</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input name="websiteUrl" type="url" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
            <input name="logoUrl" type="url" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="https://..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credibility Score (0-100)</label>
            <input name="credibilityScore" type="number" min={0} max={100} defaultValue={50} className="w-full border border-gray-300 rounded-md px-3 py-2" />
            <p className="text-xs text-gray-500 mt-1">Higher scores give more weight in aggregated ratings</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Create Source</button>
            <a href="/admin/review-sources" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  )
}
