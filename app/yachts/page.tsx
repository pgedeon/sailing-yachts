import Link from 'next/link'

export default async function YachtsPage() {
  // Fetch manufacturers for the sidebar
  const manufacturersResponse = await fetch('http://localhost:3000/api/manufacturers')
  const manufacturers = await manufacturersResponse.json()
 
  // Fetch yachts data
  const yachtsResponse = await fetch('http://localhost:3000/api/yachts')
  const yachts = await yachtsResponse.json()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Sailing Yachts</h1>
        <p className="text-gray-600 mb-8">Browse sailing yachts by manufacturer and specifications</p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Manufacturers List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Manufacturers</h2>
              <ul className="space-y-3">
                {manufacturers.map((manufacturer: any) => (
                  <li key={manufacturer.id}>
                    <Link
                      href={`/yachts?manufacturer=${encodeURIComponent(manufacturer.name)}`}
                      className="block text-gray-700 hover:text-blue-600 transition duration-200 px-2 py-1 rounded hover:bg-gray-50"
                    >
                      {manufacturer.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Content - Yachts List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {yachts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No yachts found. Please check back later.</p>
              ) : (
                <div className="space-y-6">
                  {yachts.map((yacht: any) => (
                    <div key={yacht.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h3 className="text-xl font-semibold text-blue-700 mb-2 hover:text-blue-800">
                        {yacht.name}
                      </h3>
                      <p className="text-gray-600 mb-1">Manufacturer: {yacht.manufacturer}</p>
                      {yacht.lengthOverall && (
                        <p className="text-gray-600 mb-1">Length: {yacht.lengthOverall.toFixed(1)} m</p>
                      )}
                      {yacht.beam && (
                        <p className="text-gray-600 mb-1">Beam: {yacht.beam.toFixed(1)} m</p>
                      )}
                      {yacht.draft && (
                        <p className="text-gray-600 mb-1">Draft: {yacht.draft.toFixed(1)} m</p>
                      )}
                      {yacht.displacement && (
                        <p className="text-gray-600 mb-1">Displacement: {yacht.displacement} kg</p>
                      )}
                      {yacht.year && (
                        <p className="text-gray-600 mb-1">Year: {yacht.year}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
