/// <reference lib="webworker" />

// Service Worker for Sailing Yachts — push notifications & offline caching (P9.7)

const CACHE_NAME = 'sailing-yachts-v1'

// Install — activate immediately
self.addEventListener('install', () => {
  self.skipWaiting()
})

// Activate — claim all clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)),
      ),
    ).then(() => self.clients.claim()),
  )
})

// Push event — display notification
self.addEventListener('push', (event) => {
  let title = 'Sailing Yachts'
  const options: NotificationOptions = {
    body: 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'sailing-yachts-push',
    renotify: true,
  }

  if (event.data) {
    try {
      const data = event.data.json()
      if (data.title) title = data.title
      if (data.body) options.body = data.body
      if (data.url) options.data = { url: data.url }
      if (data.tag) options.tag = data.tag
    } catch {
      // Not JSON, use raw text
      options.body = event.data.text()
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click — open/focus the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url: string = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if it has the URL
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise open new window
      return self.clients.openWindow(url)
    }),
  )
})
