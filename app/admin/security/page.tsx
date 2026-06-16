import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SecurityAuditDashboard from "./SecurityAuditDashboard";

export const dynamic = "force-dynamic";

export default async function SecurityAuditPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/admin");
  }

  return <SecurityAuditDashboard />;
}
