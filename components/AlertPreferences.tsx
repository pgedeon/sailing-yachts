'use client'

import { useState, useEffect } from 'react'

interface AlertPreference {
  id: number
  alertType: string
  enabled: boolean
  frequency: string
}

const ALERT_TYPES = [
  { type: 'new_yachts', label: 'New Matching Yachts', description: 'Get notified when yachts matching your saved searches are added' },
  { type: 'price_changes', label: 'Price Changes', description: 'Get notified when prices change on your favorite yachts' },
  { type: 'new_reviews', label: 'New Reviews', description: 'Get notified when new reviews are posted for your favorite yachts' },
]

const FREQUENCY_OPTIONS = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily digest' },
  { value: 'weekly', label: 'Weekly digest' },
]

export default function AlertPreferences() {
  const [preferences, setPreferences] = useState<AlertPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    try {
      const res = await fetch('/api/alerts/preferences')
      if (res.status === 401) {
        setMessage({ type: 'error', text: 'Please sign in to manage alert preferences.' })
        setLoading(false)
        return
      }
      const data = await res.json()
      setPreferences(data.preferences || [])
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load preferences.' })
    } finally {
      setLoading(false)
    }
  }

  async function updatePref(alertType: string, enabled: boolean, frequency?: string) {
    setSaving(alertType)
    setMessage(null)

    try {
      const body: Record<string, unknown> = { alertType, enabled }
      if (frequency) body.frequency = frequency

      const res = await fetch('/api/alerts/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to update')

      const data = await res.json()

      // Update local state
      setPreferences((prev) => {
        const existing = prev.find((p) => p.alertType === alertType)
        if (existing) {
          return prev.map((p) =>
            p.alertType === alertType
              ? { ...p, enabled, frequency: frequency || p.frequency }
              : p,
          )
        } else {
          return [...prev, { id: data.id, alertType, enabled, frequency: frequency || 'daily' }]
        }
      })

      setMessage({ type: 'success', text: 'Preference updated!' })
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preference.' })
    } finally {
      setSaving(null)
    }
  }

  function getPref(alertType: string): AlertPreference | undefined {
    return preferences.find((p) => p.alertType === alertType)
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Email Alerts</h3>
      <p className="text-sm text-gray-600">
        Choose which alerts you want to receive and how often.
      </p>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {ALERT_TYPES.map(({ type, label, description }) => {
          const pref = getPref(type)
          const isEnabled = pref?.enabled ?? false
          const freq = pref?.frequency ?? 'daily'
          const isSaving = saving === type

          return (
            <div
              key={type}
              className={`border rounded-lg p-4 transition-colors ${
                isEnabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => updatePref(type, e.target.checked)}
                        disabled={isSaving}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                    <span className="font-medium text-gray-900">{label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 ml-12">{description}</p>
                </div>

                {isEnabled && (
                  <select
                    value={freq}
                    onChange={(e) => updatePref(type, true, e.target.value)}
                    disabled={isSaving}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white disabled:opacity-50"
                  >
                    {FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
