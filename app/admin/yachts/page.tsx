import Link from 'next/link'

export default async function AdminYachtsPage() {
  // Fetch yachts data
  const response = await fetch('http://localhost:3000/api/yachts')
  const yachts = await response.json()

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

          {yachts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No yachts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Length</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beam</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {yachts.map((yacht: any) => (
                    <tr key={yacht.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{yacht.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{yacht.manufacturer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {yacht.lengthOverall ? yacht.lengthOverall.toFixed(1) : 'N/A'} m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {yacht.beam ? yacht.beam.toFixed(1) : 'N/A'} m
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {yacht.year || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <Link
                          href={`/admin/yachts/${yacht.id}/edit`}
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
