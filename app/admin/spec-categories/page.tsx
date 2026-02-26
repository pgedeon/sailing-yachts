import Link from 'next/link'

export const dynamic = 'force-dynamic' // Disable static generation

export default async function AdminSpecCategoriesPage() {
  let categories: any[] = []
  let errorMsg: string | null = null

  try {
    // Fetch spec categories data using absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sailing-yachts.vercel.app'
    const response = await fetch(`${baseUrl}/api/spec-categories`)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }
    const data = await response.json()
    categories = data.categories || []
  } catch (error) {
    console.error('Failed to fetch spec categories:', error)
    errorMsg = error instanceof Error ? error.message : 'Unknown error'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Specification Categories</h1>
          <Link
            href="/admin"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Specification Categories</h2>
            <Link
              href="/admin/spec-categories/new"
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 text-sm"
            >
              Add New Category
            </Link>
          </div>

          {errorMsg ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {errorMsg}</span>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No specification categories found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filterable</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category: any) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{category.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.unit || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.dataType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.categoryGroup}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {category.isFilterable ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Link
                          href={`/admin/spec-categories/${category.id}/edit`}
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs bg-blue-50"
                        >
                          Edit
                        </Link>
                        <button className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-xs bg-red-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}