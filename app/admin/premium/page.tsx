import { requireAdmin } from '@/lib/admin-auth'
import PremiumAdminClient from './PremiumAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPremiumPage() {
  await requireAdmin()
  return <PremiumAdminClient />
}
