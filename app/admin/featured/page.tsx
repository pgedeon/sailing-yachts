import { requireAdmin } from "@/lib/admin-auth";
import FeaturedAdminClient from "./FeaturedAdminClient";

export const dynamic = "force-dynamic";

export default async function FeaturedPage() {
  await requireAdmin();
  return <FeaturedAdminClient />;
}
