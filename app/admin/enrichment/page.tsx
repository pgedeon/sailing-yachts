import { requireAdmin } from '@/lib/admin-auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import EnrichmentClient from './EnrichmentClient'

export const dynamic = 'force-dynamic'

interface SourceInfo {
  id: number
  name: string
  enabled: boolean
  lastRunAt: string | null
  totalFetched: number
  totalUpdated: number
  totalErrors: number
}

interface LogEntry {
  id: number
  yachtModelId: number | null
  status: string
  fieldsUpdated: string[] | null
  errorMessage: string | null
  startedAt: string
  completedAt: string | null
}

interface FieldCoverage {
  total: number
  filled: number
  percentage: number
}

interface EnrichmentStatusData {
  sources: SourceInfo[]
  candidatesCount: number
  recentLogs: LogEntry[]
  fieldCoverage: Record<string, FieldCoverage>
}

export default async function AdminEnrichmentPage() {
  await requireAdmin()

  let data: EnrichmentStatusData | null = null
  let fetchError: string | null = null

  try {
    const headersList = await headers()
    const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    const baseUrl = host ? `${proto}://${host}` : 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/enrichment`, {
      cache: 'no-store',
      headers: { cookie: headersList.get('cookie') ?? '' },
    })
    if (!res.ok) throw new Error('Failed to fetch enrichment data')
    data = await res.json()
  } catch (e) {
    fetchError = e instanceof Error ? e.message : 'Unknown error'
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Link href="/admin" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Admin</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Data Enrichment Pipeline</h1>
        </div>
        <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b' }}>
          Error loading enrichment data: {fetchError}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link href="/admin" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Admin</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Data Enrichment Pipeline</h1>
      </div>
      <EnrichmentClient
        sources={data.sources}
        candidatesCount={data.candidatesCount}
        recentLogs={data.recentLogs}
        fieldCoverage={data.fieldCoverage}
      />
    </div>
  )
}
