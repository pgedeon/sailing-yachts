import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import TranslationsClient from "./TranslationsClient";

export const metadata: Metadata = {
  title: "Translation Management — Admin",
  description: "Manage multilingual content translations",
};

export default async function TranslationsAdminPage() {
  await requireAdmin();
  return <TranslationsClient />;
}
