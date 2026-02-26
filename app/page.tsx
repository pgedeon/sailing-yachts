import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-6">Sailing Yachts Database</h1>
      <p className="mb-8 text-lg text-gray-700">
        Explore specifications of sailing yachts from top manufacturers.
      </p>
      <Link
        href="/yachts"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Browse Yachts
      </Link>
    </main>
  );
}
