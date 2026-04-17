import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sailing Yacht Info API Documentation',
  description: 'Public API for accessing sailing yacht data from the Sailing Yacht Info',
};

export default function ApiPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sailing Yacht Info API</h1>
        <p className="text-gray-600">Access sailing yacht data for your applications</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold mb-2">Quick Links</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/api/v1/yachts" className="text-blue-600 hover:underline">
              GET /api/v1/yachts
            </Link>
            <span className="text-gray-600 ml-2">— List all yachts</span>
          </li>
          <li>
            <Link href="/api/v1/yachts/[slug]" className="text-blue-600 hover:underline">
              GET /api/v1/yachts/[slug]
            </Link>
            <span className="text-gray-600 ml-2">— Single yacht details</span>
          </li>
          <li>
            <Link href="/api/v1/manufacturers" className="text-blue-600 hover:underline">
              GET /api/v1/manufacturers
            </Link>
            <span className="text-gray-600 ml-2">— List manufacturers</span>
          </li>
          <li>
            <Link href="/api/v1/manufacturers/[id]" className="text-blue-600 hover:underline">
              GET /api/v1/manufacturers/[id]
            </Link>
            <span className="text-gray-600 ml-2">— Manufacturer with yachts</span>
          </li>
          <li>
            <Link href="/api/v1/search" className="text-blue-600 hover:underline">
              GET /api/v1/search
            </Link>
            <span className="text-gray-600 ml-2">— Search yachts</span>
          </li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Rate Limits</h2>
        <p className="mb-2">Free tier: <strong>100 requests per minute</strong> per IP address</p>
        <p>Response headers include rate limit information: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset</p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Interactive Testing</h2>
        <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
          <p className="mb-2">Try from your terminal:</p>
          <div className="bg-white p-3 rounded border">
            <p>$ curl "https://info.sailboats.fr/api/v1/yachts?limit=3"</p>
          </div>
        </div>
      </div>

      <div className="prose prose-blue">
        <div dangerouslySetInnerHTML={{ __html: '<!-- Include markdown content -->' }} />
      </div>
    </div>
  );
}