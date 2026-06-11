import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminLoginForm from './AdminLoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (session?.user && session.user.role === 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Signed in as {session.user.email}</span>
              <a
                href="/api/auth/signout?callbackUrl=/admin"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
              >
                Logout
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Manufacturers</h2>
              <p className="text-gray-600 mb-4">Manage yacht manufacturers and brands.</p>
              <a
                href="/admin/manufacturers"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Manufacturers
              </a>
            </div>


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Premium Tiers</h2>
              <p className="text-gray-600 mb-4">Manage premium listing tiers, verified badges, and premium content for manufacturers.</p>
              <a
                href="/admin/premium"
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition duration-200"
              >
                Manage Premium Tiers
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Yachts</h2>
              <p className="text-gray-600 mb-4">Manage yacht models and specifications.</p>
              <a
                href="/admin/yachts"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Yachts
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Prices</h2>
              <p className="text-gray-600 mb-4">Manage yacht pricing data, CSV imports, and confidence scores.</p>
              <a
                href="/admin/prices"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Prices
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Reviews</h2>
              <p className="text-gray-600 mb-4">Manage yacht reviews and ratings.</p>
              <a
                href="/admin/reviews"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Reviews
              </a>
            </div>
              <a
                href="/admin/review-sources"
                className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 ml-2"
              >
                Review Sources
              </a>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Specification Categories</h2>
              <p className="text-gray-600 mb-4">Manage specification categories and types.</p>
              <a
                href="/admin/spec-categories"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Specifications
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Leads</h2>
              <p className="text-gray-600 mb-4">View and manage dealer inquiries and lead attribution.</p>
              <a
                href="/admin/leads"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Leads
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Newsletter</h2>
              <p className="text-gray-600 mb-4">View and manage newsletter subscribers.</p>
              <a
                href="/admin/newsletter"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Subscribers
              </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Guides CMS</h2>
              <p className="text-gray-600 mb-4">Create, edit, and manage sailing guides and articles.</p>
              <a
                href="/admin/guides"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Guides
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Completeness Audit</h2>
              <p className="text-gray-600 mb-4">Analyze yacht spec completeness and identify data gaps.</p>
              <a
                href="/admin/completeness"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Audit Report
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Image Coverage Audit</h2>
              <p className="text-gray-600 mb-4">Identify yachts missing images and track media coverage.</p>
              <a
                href="/admin/image-coverage"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Coverage Report
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Spec Validation</h2>
              <p className="text-gray-600 mb-4">Validate yacht specs for data errors, anomalies, and derived calculations.</p>
              <a
                href="/admin/validation"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Validation Report
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Web Vitals</h2>
              <p className="text-gray-600 mb-4">Monitor real-user Core Web Vitals (LCP, INP, CLS) and performance metrics.</p>
              <a
                href="/admin/vitals"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Vitals Dashboard
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Auto Descriptions</h2>
              <p className="text-gray-600 mb-4">Generate and review auto-generated yacht descriptions from spec data.</p>
              <a
                href="/admin/descriptions"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Descriptions
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Featured Yachts</h2>
              <p className="text-gray-600 mb-4">Manage yacht of the week selections, schedule weekly features, and track newsletter sends.</p>
              <a
                href="/admin/featured"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                Manage Featured
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Analytics</h2>
              <p className="text-gray-600 mb-4">User behavior tracking: page views, popular yachts, search trends, comparison patterns, and more.</p>
              <a
                href="/admin/analytics"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Analytics
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">A/B Testing</h2>
              <p className="text-gray-600 mb-4">Manage experiments, track variant performance, and calculate statistical significance.</p>
              <a
                href="/admin/ab-testing"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Experiments
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Conversion Funnel</h2>
              <p className="text-gray-600 mb-4">Track user journey from landing to lead. Identify drop-off points and optimize conversions.</p>
              <a
                href="/admin/funnel"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Funnel
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Search Analytics</h2>
              <p className="text-gray-600 mb-4">Analyze search queries, zero-result searches, popular filters, and surface content gaps.</p>
              <a
                href="/admin/search-analytics"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Search Analytics
              </a>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Competitive Positioning</h2>
              <p className="text-gray-600 mb-4">Manufacturer positioning matrix, segment coverage, and price tier analysis.</p>
              <a
                href="/admin/competitive-positioning"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                View Positioning
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
}
