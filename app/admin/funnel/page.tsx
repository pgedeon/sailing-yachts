import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import FunnelDashboardClient from "./FunnelDashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversion Funnel - Admin" };

export default async function FunnelPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <a href="/admin" className="text-blue-600 hover:underline text-sm">
              ← Back to Dashboard
            </a>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">
              Conversion Funnel
            </h1>
            <p className="text-gray-500 mt-1">
              Track user journey: Landing → Search → Detail → Compare → Lead. Identify drop-off points and optimize conversions.
            </p>
          </div>
        </div>
        <FunnelDashboardClient />
      </div>
    </div>
  );
}
