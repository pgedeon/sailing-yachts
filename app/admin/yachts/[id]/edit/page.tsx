import { requireAdmin } from "@/lib/admin-auth";
import EditYachtClient from "./EditYachtClient";

export const dynamic = "force-dynamic";

export default async function EditYachtPage() {
  await requireAdmin();
  return <EditYachtClient />;
}
