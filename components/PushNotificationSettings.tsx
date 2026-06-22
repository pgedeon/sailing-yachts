'use client'

import { useState, useEffect, useCallback } from 'react'

interface PushSubscriptionInfo {
  id: number
  endpoint: string
  notifyNewMatches: boolean
  notifyPriceChanges: boolean
  frequency: string
  quietHoursStart: number | null
  quietHoursEnd: number | null
  createdAt: string
}

type PermissionState = 'default' | 'granted' | 'denied'

export default function PushNotificationSettings() {
  const [permission, setPermission] = useState<PermissionState>('default')
  const [subscription, setSubscription] = useState<PushSubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const swSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  const clearMessage = useCallback(() => {
    setTimeout(() => setMessage(null), 4000)
  }, [])

  // Load current state
  useEffect(() => {
    async function loadState() {
      if (!swSupported) {
        setLoading(false)
        return
      }

      try {
        // Check permission
        if ('Notification' in window) {
          setPermission(Notification.permission as PermissionState)
        }

        // Load existing subscription from server
        const res = await fetch('/api/user/push-subscriptions')
        if (res.ok) {
          const data = await res.json()
          if (data.subscriptions?.length > 0) {
            setSubscription(data.subscriptions[0])
          }
        }
      } catch (err) {
        console.error('[push-settings] load error:', err)
      } finally {
        setLoading(false)
      }
    }

    loadState()
  }, [swSupported])

  const handleEnable = async () => {
    setSaving(true)
    setMessage(null)

    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionState)

      if (perm !== 'granted') {
        setMessage({ type: 'error', text: 'Notification permission was denied.' })
        setSaving(false)
        clearMessage()
        return
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready

      // Get push subscription — using a dummy key since we don't have VAPID keys yet
      // In production, this would use applicationServerKey (VAPID public key)
      let pushSub = await registration.pushManager.getSubscription()

      if (!pushSub) {
        // For now, create subscription without VAPID (limited browser support)
        // When VAPID keys are configured, this will be: registration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: VAPID_PUBLIC_KEY
        // })
        try {
          pushSub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
          })
        } catch {
          // Some browsers require applicationServerKey — fall back gracefully
          setMessage({
            type: 'error',
            text: 'Push notifications require server configuration (VAPID keys). This feature will be fully enabled once keys are configured.',
          })
          clearMessage()
          setSaving(false)
          return
        }
      }

      // Save to server
      const subJson = pushSub.toJSON()
      const res = await fetch('/api/user/push-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: pushSub.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh ?? '',
            auth: subJson.keys?.auth ?? '',
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        // Reload subscription info
        const infoRes = await fetch('/api/user/push-subscriptions')
        if (infoRes.ok) {
          const infoData = await infoRes.json()
          if (infoData.subscriptions?.length > 0) {
            setSubscription(infoData.subscriptions[0])
          }
        }
        setMessage({ type: 'success', text: 'Push notifications enabled!' })
      } else {
        const err = await res.json()
        setMessage({ type: 'error', text: err.error || 'Failed to enable push notifications' })
      }
    } catch (err) {
      console.error('[push-settings] enable error:', err)
      setMessage({ type: 'error', text: 'Failed to enable push notifications. Please try again.' })
    } finally {
      setSaving(false)
      clearMessage()
    }
  }

  const handleDisable = async () => {
    if (!subscription) return
    setSaving(true)
    setMessage(null)

    try {
      // Unsubscribe from push manager
      const registration = await navigator.serviceWorker.ready
      const pushSub = await registration.pushManager.getSubscription()
      if (pushSub) {
        await pushSub.unsubscribe()
      }

      // Remove from server
      const res = await fetch(
        `/api/user/push-subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`,
        { method: 'DELETE' },
      )

      if (res.ok) {
        setSubscription(null)
        setMessage({ type: 'success', text: 'Push notifications disabled.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to disable push notifications.' })
      }
    } catch (err) {
      console.error('[push-settings] disable error:', err)
      setMessage({ type: 'error', text: 'Failed to disable push notifications.' })
    } finally {
      setSaving(false)
      clearMessage()
    }
  }

  const handlePreferenceUpdate = async (updates: Partial<Pick<PushSubscriptionInfo, 'notifyNewMatches' | 'notifyPriceChanges' | 'frequency' | 'quietHoursStart' | 'quietHoursEnd'>>) => {
    if (!subscription) return
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/push-subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          ...updates,
        }),
      })

      if (res.ok) {
        setSubscription({ ...subscription, ...updates })
        setMessage({ type: 'success', text: 'Preferences updated.' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update preferences.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preferences.' })
    } finally {
      setSaving(false)
      clearMessage()
    }
  }

  if (!swSupported) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-3xl mb-3">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Push Notifications Not Supported</h3>
        <p className="text-sm text-gray-600">
          Your browser does not support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message toast */}
      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Permission status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Browser Permission</h3>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              permission === 'granted'
                ? 'bg-green-500'
                : permission === 'denied'
                  ? 'bg-red-500'
                  : 'bg-yellow-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {permission === 'granted'
              ? 'Notifications allowed'
              : permission === 'denied'
                ? 'Notifications blocked — enable in browser settings'
                : 'Not yet requested'}
          </span>
        </div>
      </div>

      {/* Enable/Disable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Browser Push Notifications</h3>
          <p className="text-sm text-gray-600 mt-1">
            Receive instant alerts for new matching yachts and price changes
          </p>
        </div>
        <button
          onClick={subscription ? handleDisable : handleEnable}
          disabled={saving || permission === 'denied'}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            subscription ? 'bg-blue-600' : 'bg-gray-200'
          } ${saving || permission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
          role="switch"
          aria-checked={!!subscription}
          aria-label="Toggle push notifications"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              subscription ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Preferences (only shown when subscribed) */}
      {subscription && (
        <div className="space-y-5 border-t pt-5">
          {/* Notification types */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Notify me about</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subscription.notifyNewMatches}
                  onChange={(e) => handlePreferenceUpdate({ notifyNewMatches: e.target.checked })}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">New yachts matching my saved searches</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={subscription.notifyPriceChanges}
                  onChange={(e) => handlePreferenceUpdate({ notifyPriceChanges: e.target.checked })}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Price changes on my favorite yachts</span>
              </label>
            </div>
          </div>

          {/* Frequency */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Frequency</h4>
            <div className="space-y-2">
              {[
                { value: 'immediate', label: 'Immediate', desc: 'As events happen' },
                { value: 'daily', label: 'Daily digest', desc: 'Once per day' },
                { value: 'weekly', label: 'Weekly summary', desc: 'Once per week' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="push-frequency"
                    checked={subscription.frequency === opt.value}
                    onChange={() => handlePreferenceUpdate({ frequency: opt.value })}
                    disabled={saving}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {opt.label}{' '}
                    <span className="text-gray-400">— {opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quiet hours */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quiet Hours</h4>
            <p className="text-sm text-gray-500 mb-3">
              Silence notifications during certain hours
            </p>
            <div className="flex items-center gap-3">
              <select
                value={subscription.quietHoursStart ?? 22}
                onChange={(e) =>
                  handlePreferenceUpdate({
                    quietHoursStart: parseInt(e.target.value),
                    quietHoursEnd: subscription.quietHoursEnd ?? 8,
                  })
                }
                disabled={saving}
                className="block w-20 rounded-md border border-gray-300 bg-white py-1.5 px-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">to</span>
              <select
                value={subscription.quietHoursEnd ?? 8}
                onChange={(e) =>
                  handlePreferenceUpdate({
                    quietHoursStart: subscription.quietHoursStart ?? 22,
                    quietHoursEnd: parseInt(e.target.value),
                  })
                }
                disabled={saving}
                className="block w-20 rounded-md border border-gray-300 bg-white py-1.5 px-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
              {subscription.quietHoursStart !== null && (
                <button
                  onClick={() =>
                    handlePreferenceUpdate({ quietHoursStart: null, quietHoursEnd: null })
                  }
                  disabled={saving}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Unsubscribe */}
          <div className="pt-3 border-t">
            <button
              onClick={handleDisable}
              disabled={saving}
              className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
            >
              Unsubscribe from all push notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
