(function() {
    'use strict';

    self.addEventListener('push', function(event) {
        console.log('Push received:', event);
        let data = {};
        if (event.data) {
            try {
                data = event.data.json();
            } catch (e) {
                data = { title: 'Sugam Garbh', body: event.data.text() };
            }
        }

        const options = {
            body: data.body || 'New update from Sugam Garbh',
            icon: data.icon || '/images/logo.png',
            badge: '/images/badge.png',
            data: {
                url: data.url || '/'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Sugam Garbh', options)
        );
    });

    self.addEventListener('notificationclick', function(event) {
        event.notification.close();
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    });
})();