const webpush = require('web-push');

// In a real app, these should be in environment variables
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

if (publicVapidKey && privateVapidKey) {
    webpush.setVapidDetails(
        'mailto:support@sugamgarbh.com',
        publicVapidKey,
        privateVapidKey
    );
}

class NotificationService {
    async sendNotification(subscription, payload) {
        if (!subscription) return;
        
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
            console.log('Web Push sent successfully');
        } catch (error) {
            console.error('Error sending Web Push:', error);
            if (error.statusCode === 410) {
                // Subscription has expired or is no longer valid
                return { error: 'expired' };
            }
        }
    }
}

module.exports = new NotificationService();