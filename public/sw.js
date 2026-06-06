// public/sw.js
self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  
  // Stealth Notification Data
  const title = data.title || "Global Studies Hub";
  const options = {
    body: data.body || "New course modules have been added to your syllabus.",
    icon: "/icon-192x192.png", // Apna koi boring book/hat icon laga dena public folder me
    badge: "/badge.png",
    vibrate: [200, 100, 200],
    // MAGIC FIX: Forces Android to treat every ping as a brand new alert and vibrate
    tag: "stealth-ping-" + Date.now(), 
    renotify: true 
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/")); // Click karne pe wapas portal pe le aayega
});