import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../api/auth/[...nextauth]/route'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/admin?error=unauthenticated')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Logged in as: <strong>{session.user?.username || session.user?.name}</strong>
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/yachts"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-medium text-gray-900">Manage Yachts</h3>
            <p className="text-gray-500">View, edit, and create yacht entries</p>
          </Link>
          <Link
            href="/admin/manufacturers"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-medium text-gray-900">Manage Manufacturers</h3>
            <p className="text-gray-500">View, edit, and create manufacturers</p>
          </Link>
          <Link
            href="/admin/spec-categories"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <h3 className="text-lg font-medium text-gray-900">Manage Specification Categories</h3>
            <p className="text-gray-500">Define yacht specification categories</p>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
          <p className="text-gray-600">Welcome to the admin interface. Use the cards above to manage your content.</p>
        </div>
      </main>
    </div>
  )
}
