import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import DescriptionAdminClient from "./DescriptionAdminClient";

export const dynamic = "force-dynamic";

export default async function DescriptionsAdminPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Admin
          </Link>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Auto-Generated Descriptions
          </h1>
          <span className="text-sm text-gray-500">P20.1</span>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <DescriptionAdminClient />
        </Suspense>
      </div>
    </div>
  );
}
