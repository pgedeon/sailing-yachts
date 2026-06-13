import { Metadata } from "next";
import AffiliateTrackingDashboardClient from "./AffiliateTrackingDashboardClient";

export const metadata: Metadata = {
  title: "Affiliate Tracking — Admin",
  robots: { index: false },
};

export default function AffiliateTrackingPage() {
  return <AffiliateTrackingDashboardClient />;
}
