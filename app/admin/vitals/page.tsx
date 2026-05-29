import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import VitalsDashboard from "./VitalsDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Web Vitals Monitor - Admin" };

export default async function VitalsPage() {
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
              Core Web Vitals Monitor
            </h1>
            <p className="text-gray-500 mt-1">
              Real-user performance metrics (RUM) — collected from site visitors
            </p>
          </div>
        </div>
        <VitalsDashboard />
      </div>
    </div>
  );
}
