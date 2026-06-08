// ── Push notification handler ────────────────────────────────────────────────

self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'LiraPro';
  const options = {
    body: data.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    dir: 'rtl',
    lang: 'ar',
    tag: 'lirapro-broadcast',
    renotify: true,
    data: { url: data.url || '/app/home', notifId: data.notifId || null },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click — navigate to target URL ───────────────────────────────

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = event.notification.data?.url || '/app/home';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});

// ── Notification close — user dismissed without clicking ─────────────────────

self.addEventListener('notificationclose', function (event) {
  const notifId = event.notification.data?.notifId || null;
  // Inform all open app windows so they can update unread counts
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clientList) {
      clientList.forEach(function (client) {
        client.postMessage({ type: 'NOTIFICATION_DISMISSED', notifId: notifId });
      });
    })
  );
});

// ── Background sync — replay queued notification read receipts ───────────────

self.addEventListener('sync', function (event) {
  if (event.tag === 'lirapro-notification-reads') {
    event.waitUntil(flushNotificationReads());
  }
});

function openSyncDb() {
  return new Promise(function (resolve, reject) {
    const req = indexedDB.open('lirapro-sw-sync', 1);
    req.onupgradeneeded = function (e) {
      e.target.result.createObjectStore('pending-reads', { keyPath: 'key' });
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function () { reject(req.error); };
  });
}

async function flushNotificationReads() {
  let db;
  try { db = await openSyncDb(); } catch { return; }
  const items = await new Promise(function (resolve) {
    const tx = db.transaction('pending-reads', 'readonly');
    const req = tx.objectStore('pending-reads').getAll();
    req.onsuccess = function () { resolve(req.result || []); };
    req.onerror = function () { resolve([]); };
  });
  const flushed = [];
  for (const item of items) {
    try {
      const resp = await fetch('/api/notifications/' + item.notifId + '/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: item.walletId }),
      });
      if (resp.ok) flushed.push(item.key);
    } catch { /* keep for next sync attempt */ }
  }
  if (flushed.length > 0) {
    const tx = db.transaction('pending-reads', 'readwrite');
    const store = tx.objectStore('pending-reads');
    flushed.forEach(function (key) { store.delete(key); });
  }
  db.close();
}
