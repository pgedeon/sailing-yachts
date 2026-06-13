import { requireAdmin } from '@/lib/admin-auth'
import ReportsAdminClient from './ReportsAdminClient'

export const dynamic = 'force-dynamic'

export default async function ReportsAdminPage() {
  await requireAdmin()
  return <ReportsAdminClient />
}
