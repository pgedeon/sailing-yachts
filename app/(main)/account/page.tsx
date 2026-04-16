import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Account",
  description: "Manage your favorites, saved searches, comparisons, and alert preferences.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountDashboard />;
}

import AccountDashboard from "./AccountDashboard";
