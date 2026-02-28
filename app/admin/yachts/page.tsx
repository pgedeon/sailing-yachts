import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminYachtsPage() {
  // Authentication check - redirect to login if not authenticated
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value
  if (!authCookie) {
    redirect('/admin')
  }

  let yachts: any[] = []
  let fetchError: string | null = null
  
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sailing-yachts.vercel.app'
    const response = await fetch(`${baseUrl}/api/yachts?limit=100`, {
      next: { revalidate: 0 }
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('API response error:', response.status, errorText)
      fetchError = `Failed to load yachts: ${response.status}`
    } else {
      const data = await response.json()
      yachts = data.yachts || []
      console.log('Loaded yachts:', yachts.length)
    }
  } catch (error) {
    console.error('Failed to fetch yachts:', error)
    fetchError = error instanceof Error ? error.message : 'Unknown error'
  }

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Yachts List</h2>
            <Link
              href="/admin/yachts/new"
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 text-sm"
            >
              Add New Yacht
            </Link>
          </div>

          {fetchError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {fetchError}</span>
            </div>
          ) : yachts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No yachts found. <Link href="/admin/yachts/new" className="text-blue-600 hover:underline">Add one</Link></p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draft</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yachts.map((yacht: any) => {
                    return (
                      <tr key={yacht.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{yacht.modelName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{yacht.manufacturer || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {yacht.lengthOverall ? Number(yacht.lengthOverall).toFixed(1) : 'N/A'} m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {yacht.beam ? Number(yacht.beam).toFixed(1) : 'N/A'} m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {yacht.draft ? Number(yacht.draft).toFixed(1) : 'N/A'} m
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {yacht.year || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          <Link
                            href={`/admin/yachts/${yacht.id}/edit`}
                            prefetch={false}
                            className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs bg-blue-50"
                          >
                            Edit
                          </Link>
                          <form action={`/api/admin/yachts/${yacht.id}/delete`} method="POST" style={{ display: 'inline' }} onSubmit={(e) => { if (!window.confirm('Are you sure you want to delete this yacht?')) e.preventDefault(); }}>
                            <button type="submit" className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-xs bg-red-50">Delete</button>
                          </form>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
