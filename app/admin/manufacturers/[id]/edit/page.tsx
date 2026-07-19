import { requireAdmin } from "@/lib/admin-auth";
import EditManufacturerClient from "./EditManufacturerClient";

export const dynamic = "force-dynamic";

export default async function EditManufacturerPage() {
  await requireAdmin();
  return <EditManufacturerClient />;
}
