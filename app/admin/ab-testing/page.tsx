import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminLoginForm from "../AdminLoginForm";
import AbTestingDashboardClient from "./AbTestingDashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "A/B Testing Dashboard | Admin",
};

export default async function AbTestingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    );
  }

  return <AbTestingDashboardClient />;
}
