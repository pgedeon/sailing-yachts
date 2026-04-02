import Link from "next/link";
import { generateWebsiteJsonLd } from "@/lib/seo";

export default function Home() {
  const jsonLd = generateWebsiteJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
          Sailing Yachts Database
        </h1>
        <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-700 text-center max-w-lg">
          Explore specifications of sailing yachts from top manufacturers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/yachts"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center"
          >
            Browse Yachts
          </Link>
          <Link
            href="/compare"
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition text-center"
          >
            Compare
          </Link>
        </div>
      </main>
    </>
  );
}
