// Prospect Manager service worker: makes the app installable and shows push
// notifications. It deliberately does not cache pages, so every update of the
// site is visible immediately.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

// Network passthrough (an empty handler keeps the app installable everywhere).
self.addEventListener('fetch', () => {});

// Push payloads are FCM data messages: { data: { title, body, url, tag } }.
// Every push must show a notification (iOS revokes permission otherwise).
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = {}; }
  const data = payload.data || payload.notification || payload || {};
  const title = data.title || 'Prospect Manager';
  const options = {
    body: data.body || 'Hai una nuova notifica.',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || './' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope)) {
        await client.focus();
        if ('navigate' in client && client.url !== target) { try { await client.navigate(target); } catch (e) {} }
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
