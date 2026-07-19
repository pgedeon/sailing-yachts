import { requireAdmin } from "@/lib/admin-auth";
import NewsletterAdminClient from "./NewsletterAdminClient";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  await requireAdmin();
  return <NewsletterAdminClient />;
}
