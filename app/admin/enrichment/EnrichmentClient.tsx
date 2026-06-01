'use client'

import { useState } from 'react'

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

interface EnrichmentClientProps {
  sources: SourceInfo[]
  candidatesCount: number
  recentLogs: LogEntry[]
  fieldCoverage: Record<string, FieldCoverage>
}

const FIELD_LABELS: Record<string, string> = {
  beam: 'Beam',
  draft: 'Draft',
  displacement: 'Displacement',
  ballast: 'Ballast',
  sail_area_main: 'Sail Area (Main)',
  engine_hp: 'Engine HP',
  cabins: 'Cabins',
  berths: 'Berths',
  heads: 'Heads',
  keel_type: 'Keel Type',
  rig_type: 'Rig Type',
  fuel_capacity: 'Fuel Capacity',
  water_capacity: 'Water Capacity',
}

export default function EnrichmentClient({
  sources,
  candidatesCount,
  recentLogs,
  fieldCoverage,
}: EnrichmentClientProps) {
  const [status, setStatus] = useState<string>('')
  const [result, setResult] = useState<{ html: string; visible: boolean }>({ html: '', visible: false })

  async function runEnrichment(dryRun: boolean, limit = 20) {
    setStatus('⏳ Running...')
    setResult({ html: '', visible: false })

    try {
      const res = await fetch('/api/admin/enrichment/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun, limit, rateLimitMs: 3000 }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      if (data.dryRun) {
        setResult({
          visible: true,
          html: `<div style="padding:1rem;background:#fefce8;border:1px solid #fde68a;border-radius:6px;">
            <strong>Dry Run — ${data.totalCandidates} candidates found:</strong>
            <ul style="margin-top:0.5rem;list-style:disc;padding-left:1.5rem;">
              ${data.candidates.map((c: { manufacturer: string; model: string; missingFields: string[] }) =>
                `<li>${c.manufacturer} ${c.model} — missing: ${c.missingFields.join(', ')}</li>`
              ).join('')}
            </ul></div>`,
        })
      } else {
        setResult({
          visible: true,
          html: `<div style="padding:1rem;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;">
            <strong>✅ Enrichment Complete</strong>
            <div style="margin-top:0.5rem;font-size:0.875rem;">
              Processed: ${data.stats.processed} |
              Updated: ${data.stats.updated} |
              No Data: ${data.stats.noData} |
              Errors: ${data.stats.errors} |
              Duration: ${(data.stats.durationMs / 1000).toFixed(1)}s
            </div></div>`,
        })
      }

      setStatus('✅ Done — reload page to see updated logs')
      setTimeout(() => setStatus(''), 8000)
    } catch (err) {
      setStatus('')
      setResult({
        visible: true,
        html: `<div style="padding:1rem;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#991b1b;">
          ❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}</div>`,
      })
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1.5rem', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>Yachts Needing Data</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e3a8a' }}>{candidatesCount}</div>
        </div>
        {sources.map((source) => (
          <div key={source.id} style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '0.875rem', color: '#166534' }}>{source.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.25rem' }}>
              {source.enabled ? '✅ Enabled' : '⏸ Disabled'} • Updated: {source.totalUpdated}
            </div>
            {source.lastRunAt && (
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Last run: {new Date(source.lastRunAt).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Run Controls */}
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Run Enrichment</h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
          Fetch missing yacht specifications from external data sources. The process runs with rate limiting to respect source websites.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            style={{ padding: '0.5rem 1rem', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => runEnrichment(true)}
          >
            🔍 Dry Run (Preview)
          </button>
          <button
            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => runEnrichment(false, 10)}
          >
            ▶️ Enrich 10 Yachts
          </button>
          <button
            style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}
            onClick={() => runEnrichment(false, 50)}
          >
            ▶️ Enrich 50 Yachts
          </button>
          {status && <span style={{ fontSize: '0.875rem', color: '#6b7280', alignSelf: 'center' }}>{status}</span>}
        </div>
        {result.visible && (
          <div style={{ marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: result.html }} />
        )}
      </div>

      {/* Field Coverage */}
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Field Coverage</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '0.75rem' }}>
          {Object.entries(fieldCoverage)
            .sort((a, b) => a[1].percentage - b[1].percentage)
            .map(([field, coverage]) => (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {FIELD_LABELS[field] || field}
                  </div>
                  <div style={{ width: '100%', background: '#e5e7eb', borderRadius: '4px', height: '8px', marginTop: '2px' }}>
                    <div
                      style={{
                        width: `${coverage.percentage}%`,
                        background: coverage.percentage >= 90 ? '#10b981' : coverage.percentage >= 70 ? '#f59e0b' : '#ef4444',
                        borderRadius: '4px',
                        height: '8px',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', minWidth: '3rem', textAlign: 'right' }}>
                  {coverage.percentage}%
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Enrichment Logs</h2>
        {recentLogs.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No enrichment runs yet. Use the buttons above to start.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Time</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Yacht ID</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Fields Updated</th>
                  <th style={{ padding: '0.5rem', textAlign: 'left' }}>Error</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.5rem' }}>
                      {new Date(log.startedAt).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {log.yachtModelId ? (
                        <a href={`/admin/yachts/${log.yachtModelId}`} style={{ color: '#3b82f6' }}>
                          #{log.yachtModelId}
                        </a>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          log.status === 'success' ? '#dcfce7' :
                          log.status === 'error' ? '#fef2f2' :
                          '#fef3c7',
                        color:
                          log.status === 'success' ? '#166534' :
                          log.status === 'error' ? '#991b1b' :
                          '#92400e',
                      }}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      {log.fieldsUpdated ? log.fieldsUpdated.join(', ') : '—'}
                    </td>
                    <td style={{ padding: '0.5rem', color: '#991b1b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.errorMessage || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
