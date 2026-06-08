import { requireAdmin } from "@/lib/admin-auth";
import GuideFormClient from "../GuideFormClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "New Guide - Admin" };

export default async function NewGuidePage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/admin/guides" className="text-blue-600 hover:underline text-sm">
          ← Back to Guides
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-8">
          New Guide
        </h1>
        <GuideFormClient />
      </div>
    </div>
  );
}
