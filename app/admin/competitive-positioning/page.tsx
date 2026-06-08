import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CompetitivePositioningClient from "./CompetitivePositioningClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Competitive Positioning - Admin" };

export default async function CompetitivePositioningPage() {
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
              Competitive Positioning
            </h1>
            <p className="text-gray-500 mt-1">
              Manufacturer positioning matrix — fleet breadth, depth, price tier, and market segment coverage.
            </p>
          </div>
        </div>
        <CompetitivePositioningClient />
      </div>
    </div>
  );
}
