import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import GuidesListClient from "./GuidesListClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Guides CMS - Admin" };

export default async function AdminGuidesPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/admin" className="text-blue-600 hover:underline text-sm">
              ← Back to Dashboard
            </a>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Guides CMS
            </h1>
            <p className="text-gray-500 mt-1">
              Manage sailing guides, articles, and editorial content.
            </p>
          </div>
          <Link
            href="/admin/guides/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            + New Guide
          </Link>
        </div>

        <GuidesListClient />
      </div>
    </div>
  );
}
