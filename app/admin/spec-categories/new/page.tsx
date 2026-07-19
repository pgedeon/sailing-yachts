import { requireAdmin } from "@/lib/admin-auth";
import NewSpecCategoryClient from "./NewSpecCategoryClient";

export const dynamic = "force-dynamic";

export default async function NewSpecCategoryPage() {
  await requireAdmin();
  return <NewSpecCategoryClient />;
}
