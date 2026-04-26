// Service Worker for Web Push Notifications
self.addEventListener("push", (event) => {
  let title = "FixMyForm Reminder";
  let options = {
    body: "Time for your scheduled workout!",
    icon: "/icon-192x192.png",
    badge: "/icon-96x96.png",
    tag: "workout-reminder",
  };

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.body) options.body = data.body;
      if (data.icon) options.icon = data.icon;
    } catch {
      // If data is not JSON, use as body
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if the /coach page is already open
      for (const client of clientList) {
        if (client.url === new URL("/coach", self.location).href && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open /coach in a new window/tab
      if (clients.openWindow) {
        return clients.openWindow("/coach");
      }
    })
  );
});

self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag);
});
