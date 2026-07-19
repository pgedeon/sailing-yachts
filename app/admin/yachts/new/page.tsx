import { requireAdmin } from "@/lib/admin-auth";
import NewYachtClient from "./NewYachtClient";

export const dynamic = "force-dynamic";

export default async function NewYachtPage() {
  await requireAdmin();
  return <NewYachtClient />;
}
