import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - Sailing Yachts",
  description: "Administrative interface for managing sailing yacht data",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
