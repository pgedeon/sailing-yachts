import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface AdminPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams
  const error = params.error
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')?.value
 
  // Check if user is authenticated via cookie
  if (!authCookie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Admin Access Required</h1>
        <p className="mb-4 text-lg text-gray-700">Please log in to access the admin panel.</p>
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <form method="post" action="/api/admin/login" className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> Invalid username or password</span>
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <Link
            href="/api/admin/logout"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
          >
            Logout
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Yachts Management</h2>
            <p className="text-gray-600 mb-4">Manage sailing yacht listings and specifications.</p>
            <Link
              href="/admin/yachts"
              prefetch={false}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Manage Yachts
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Manufacturers</h2>
            <p className="text-gray-600 mb-4">Manage yacht manufacturers and brands.</p>
            <Link
              href="/admin/manufacturers"
              prefetch={false}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Manage Manufacturers
            </Link>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Specifications</h2>
            <p className="text-gray-600 mb-4">Manage specification categories and types.</p>
            <Link
              href="/admin/spec-categories"
              prefetch={false}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
            >
              Manage Specifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
