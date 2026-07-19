import { requireAdmin } from "@/lib/admin-auth";
import CampaignsClient from "./CampaignsClient";

export const dynamic = "force-dynamic";

export default async function NewsletterCampaignsPage() {
  await requireAdmin();
  return <CampaignsClient />;
}
