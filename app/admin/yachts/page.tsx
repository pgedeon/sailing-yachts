import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminYachtsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Yachts</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">The yacht management interface is being set up.</p>
            <p className="text-sm text-gray-400 mb-6">Database needs to be seeded with sample data.</p>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">To add yachts, you can:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Run the seed script: <code className="bg-gray-100 px-2 py-1 rounded">npm run seed</code></li>
                <li>Use the admin API directly at <code className="bg-gray-100 px-2 py-1 rounded">/api/admin/yachts</code></li>
                <li>Add data via PostgreSQL client</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}