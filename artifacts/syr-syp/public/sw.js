// ── Notification type → icon / tag / actionUrl mapping ───────────────────────
// 8 supported types: info, warning, success, price, admin, alert, wallet, broadcast

var TYPE_CONFIG = {
  info:      { badge: '/favicon.svg', tag: 'lirapro-info',      url: '/app/home' },
  warning:   { badge: '/favicon.svg', tag: 'lirapro-warning',   url: '/app/home' },
  success:   { badge: '/favicon.svg', tag: 'lirapro-success',   url: '/app/home' },
  price:     { badge: '/favicon.svg', tag: 'lirapro-price',     url: '/app/rates' },
  admin:     { badge: '/favicon.svg', tag: 'lirapro-admin',     url: '/app/home' },
  alert:     { badge: '/favicon.svg', tag: 'lirapro-alert',     url: '/app/alerts' },
  wallet:    { badge: '/favicon.svg', tag: 'lirapro-wallet',    url: '/app/portfolio' },
  broadcast: { badge: '/favicon.svg', tag: 'lirapro-broadcast', url: '/app/home' },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.info;
}

// ── IndexedDB helper ─────────────────────────────────────────────────────────

function openSyncDb() {
  return new Promise(function (resolve, reject) {
    var req = indexedDB.open('lirapro-sw-sync', 1);
    req.onupgradeneeded = function (e) {
      e.target.result.createObjectStore('pending-reads', { keyPath: 'key' });
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function () { reject(req.error); };
  });
}

/**
 * Enqueue a notification delivered receipt in IndexedDB for background sync.
 * Called when a push arrives — marks the notification as 'delivered' once online.
 */
async function enqueueRead(notifId, walletId) {
  if (!notifId || !walletId) return;
  try {
    var db = await openSyncDb();
    var key = String(notifId) + '-' + String(walletId);
    var tx = db.transaction('pending-reads', 'readwrite');
    tx.objectStore('pending-reads').put({ key: key, notifId: notifId, walletId: walletId });
    await new Promise(function (r) { tx.oncomplete = r; tx.onerror = r; });
    db.close();
    // Request background sync to flush receipts immediately if online
    if ('sync' in self.registration) {
      await self.registration.sync.register('lirapro-notification-reads').catch(function () {});
    }
  } catch {}
}

// ── Push notification handler ─────────────────────────────────────────────────

self.addEventListener('push', function (event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'LiraPro';
  var notifType = data.type || 'info';
  var cfg = getTypeConfig(notifType);

  // Use type-specific actionUrl unless an explicit url was provided in payload
  var actionUrl = data.url || cfg.url;

  var options = {
    body: data.body || '',
    icon: '/favicon.svg',
    badge: cfg.badge,
    dir: 'rtl',
    lang: 'ar',
    tag: cfg.tag,
    renotify: true,
    data: {
      url: actionUrl,
      notifId: data.notifId || null,
      walletId: data.walletId || null,
      type: notifType,
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(function () {
      // Enqueue a delivered receipt so flushNotificationReads can POST to /delivered
      return enqueueRead(data.notifId, data.walletId);
    })
  );
});

// ── Notification click — navigate to type-appropriate URL ─────────────────────

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var notifData = event.notification.data || {};
  var url = notifData.url || '/app/home';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── Notification close — user dismissed; relay to app for server read receipt ─
// SW cannot call authenticated endpoints, so it messages open windows.
// App.tsx handles the SW message and calls /api/notifications/:id/view with auth.

self.addEventListener('notificationclose', function (event) {
  var notifData = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clientList) {
      clientList.forEach(function (client) {
        client.postMessage({
          type: 'NOTIFICATION_DISMISSED',
          notifId: notifData.notifId || null,
          walletId: notifData.walletId || null,
        });
      });
    })
  );
});

// ── Background sync — flush queued delivered receipts when connectivity restores
// Calls /api/notifications/:id/delivered (no auth needed) to transition sent → delivered.

self.addEventListener('sync', function (event) {
  if (event.tag === 'lirapro-notification-reads') {
    event.waitUntil(flushNotificationReads());
  }
});

async function flushNotificationReads() {
  var db;
  try { db = await openSyncDb(); } catch { return; }

  var items = await new Promise(function (resolve) {
    var tx = db.transaction('pending-reads', 'readonly');
    var req = tx.objectStore('pending-reads').getAll();
    req.onsuccess = function () { resolve(req.result || []); };
    req.onerror = function () { resolve([]); };
  });

  var flushed = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    try {
      // POST to /delivered (no auth) — transitions notification_log: sent → delivered
      var resp = await fetch('/api/notifications/' + item.notifId + '/delivered', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId: item.walletId }),
      });
      if (resp.ok) flushed.push(item.key);
    } catch { /* keep for next sync attempt */ }
  }

  if (flushed.length > 0) {
    var tx2 = db.transaction('pending-reads', 'readwrite');
    var store = tx2.objectStore('pending-reads');
    flushed.forEach(function (key) { store.delete(key); });
    await new Promise(function (r) { tx2.oncomplete = r; tx2.onerror = r; });
  }
  db.close();
}
