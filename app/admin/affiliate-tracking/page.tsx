import { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import AffiliateTrackingDashboardClient from "./AffiliateTrackingDashboardClient";

export const metadata: Metadata = {
  title: "Affiliate Tracking — Admin",
  robots: { index: false },
};

export default async function AffiliateTrackingPage() {
  await requireAdmin();
  return <AffiliateTrackingDashboardClient />;
}
