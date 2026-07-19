import { requireAdmin } from "@/lib/admin-auth";
import NewManufacturerClient from "./NewManufacturerClient";

export const dynamic = "force-dynamic";

export default async function NewManufacturerPage() {
  await requireAdmin();
  return <NewManufacturerClient />;
}
