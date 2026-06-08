import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { pool } from "@/lib/db";
import EditGuideClient from "./EditGuideClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit Guide - Admin" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditGuidePage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const articleId = parseInt(id, 10);

  if (isNaN(articleId)) {
    redirect("/admin/guides");
  }

  const result = await pool.query(`SELECT * FROM articles WHERE id = $1`, [articleId]);
  if (result.rows.length === 0) {
    redirect("/admin/guides");
  }

  const article = result.rows[0];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <a href="/admin/guides" className="text-blue-600 hover:underline text-sm">
          ← Back to Guides
        </a>
        <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-8">
          Edit Guide
        </h1>
        <EditGuideClient article={article} />
      </div>
    </div>
  );
}
