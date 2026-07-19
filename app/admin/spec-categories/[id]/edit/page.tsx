import { requireAdmin } from "@/lib/admin-auth";
import EditSpecCategoryClient from "./EditSpecCategoryClient";

export const dynamic = "force-dynamic";

export default async function EditSpecCategoryPage() {
  await requireAdmin();
  return <EditSpecCategoryClient />;
}
