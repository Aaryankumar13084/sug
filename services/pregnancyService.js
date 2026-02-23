const User = require('../models/User');
const { calculatePregnancyWeek } = require('../utils/dateUtils');
const { getWeeklyContent } = require('../data/pregnancyWeeks');

class PregnancyService {
    async sendWeeklyUpdates(bot) {
        try {
            const users = await User.find({ isActive: true });
            console.log(`Checking updates for ${users.length} users...`);

            for (const user of users) {
                // Send daily health checkup reminder
                await this.sendDailyHealthReminder(bot, user);
                
                await this.checkAndSendWeeklyUpdate(bot, user);
            }
        } catch (error) {
            console.error('Error in sendWeeklyUpdates:', error);
        }
    }

    async sendDailyHealthReminder(bot, user) {
        try {
            const language = user.language || 'hindi';
            const message = language === 'english'
                ? `🌸 Good morning ${user.firstName}! Time for your daily health check. How are you feeling today?`
                : `🌸 शुभ प्रभात ${user.firstName}! आपके दैनिक स्वास्थ्य जांच का समय हो गया है। आज आप कैसा महसूस कर रही हैं?`;

            if (user.telegramId) {
                try { await bot.sendMessage(user.telegramId, message); } catch (e) {}
            }

            if (user.webPushSubscription) {
                const NotificationService = require('./notificationService');
                const ns = new NotificationService();
                await ns.sendNotification(user.webPushSubscription, {
                    title: language === 'english' ? 'Daily Health Check' : 'दैनिक स्वास्थ्य जांच',
                    body: message,
                    url: '/chat'
                });
            }
        } catch (error) {
            console.error('Error sending daily reminder:', error);
        }
    }

    async sendWeeklyHealthCheckToAll(bot) {
        try {
            const users = await User.find({ isActive: true });
            console.log(`Sending weekly health check to ${users.length} users...`);

            for (const user of users) {
                // Send health check with a 5 second delay between users to avoid spam
                setTimeout(async () => {
                    await this.sendWeeklyHealthCheck(bot, user);
                }, Math.random() * 5000);
            }
        } catch (error) {
            console.error('Error in sendWeeklyHealthCheckToAll:', error);
        }
    }

    async checkAndSendWeeklyUpdate(bot, user) {
        try {
            const currentWeek = calculatePregnancyWeek(user.dueDate);

            // Only send if this week hasn't been sent yet and it's a valid pregnancy week
            if (currentWeek > user.lastWeekSent && currentWeek >= 1 && currentWeek <= 42) {
                const content = getWeeklyContent(currentWeek, user.language);

                if (content) {
                    // First send weekly health check
                    await this.sendWeeklyHealthCheck(bot, user);

                    // Wait 2 seconds then send weekly pregnancy info
                    setTimeout(async () => {
                        const message = this.formatWeeklyMessage(currentWeek, content, user.language);

                        let options;
                        if (user.language === 'english') {
                            options = {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: 'Yes, helpful ✅', callback_data: 'feedback_yes' },
                                            { text: 'No, not helpful ❌', callback_data: 'feedback_no' }
                                        ]
                                    ]
                                },
                                parse_mode: 'HTML'
                            };
                        } else {
                            options = {
                                reply_markup: {
                                    inline_keyboard: [
                                        [
                                            { text: 'हाँ, उपयोगी था ✅', callback_data: 'feedback_yes' },
                                            { text: 'नहीं, उपयोगी नहीं था ❌', callback_data: 'feedback_no' }
                                        ]
                                    ]
                                },
                                parse_mode: 'HTML'
                            };
                        }

                        await bot.sendMessage(user.telegramId, message, options);

                        console.log(`Sent week ${currentWeek} update to user ${user.telegramId}`);
                    }, 2000);

                    // Update last week sent
                    user.lastWeekSent = currentWeek;
                    await user.save();
                }
            }
        } catch (error) {
            console.error(`Error sending update to user ${user.telegramId}:`, error);
        }
    }

    async sendCurrentWeekInfo(bot, chatId) {
        try {
            const user = await User.findOne({ telegramId: chatId.toString() });
            if (!user) return;

            const currentWeek = calculatePregnancyWeek(user.dueDate);
            const content = getWeeklyContent(currentWeek, user.language);

            if (content && currentWeek >= 1 && currentWeek <= 42) {
                const message = this.formatWeeklyMessage(currentWeek, content, user.language);

                let options;
                if (user.language === 'english') {
                    options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'Yes, helpful ✅', callback_data: 'feedback_yes' },
                                    { text: 'No, not helpful ❌', callback_data: 'feedback_no' }
                                ]
                            ]
                        },
                        parse_mode: 'HTML'
                    };
                } else {
                    options = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: 'हाँ, उपयोगी था ✅', callback_data: 'feedback_yes' },
                                    { text: 'नहीं, उपयोगी नहीं था ❌', callback_data: 'feedback_no' }
                                ]
                            ]
                        },
                        parse_mode: 'HTML'
                    };
                }

                await bot.sendMessage(chatId, message, options);

                // Update last week sent
                user.lastWeekSent = currentWeek;
                await user.save();
            }
        } catch (error) {
            console.error('Error sending current week info:', error);
        }
    }

    async removeButtons(bot, chatId, messageId) {
        try {
            await bot.editMessageReplyMarkup(
                { inline_keyboard: [] },
                {
                    chat_id: chatId,
                    message_id: messageId
                }
            );
        } catch (error) {
            console.error('Error removing buttons:', error);
        }
    }

    formatWeeklyMessage(week, content, language = 'hindi') {
        if (language === 'english') {
            return `🤱 <b>Week ${week} of Pregnancy</b>

🍼 <b>Baby Development:</b>
${content.babyDevelopment.map(point => `• ${point}`).join('\n')}

👩 <b>Changes in Mother's Body:</b>
${content.motherChanges.map(point => `• ${point}`).join('\n')}

🥗 <b>Nutritional Advice:</b>
${content.nutrition.map(point => `• ${point}`).join('\n')}

⚠️ <b>Warning Signs:</b>
${content.warningSigns.map(point => `• ${point}`).join('\n')}
<b>If you experience any of these symptoms, contact your doctor immediately!</b>

💡 <b>General Advice:</b>
${content.generalAdvice.map(point => `• ${point}`).join('\n')}

📋 <b>Disclaimer:</b> This is for educational purposes only. Continue regular doctor check-ups.

Was this information helpful?`;
        } else {
            return `🤱 <b>गर्भावस्था का ${week}वां सप्ताह</b>

🍼 <b>शिशु का विकास:</b>
${content.babyDevelopment.map(point => `• ${point}`).join('\n')}

👩 <b>माँ के शरीर में बदलाव:</b>
${content.motherChanges.map(point => `• ${point}`).join('\n')}

🥗 <b>पोषण की सलाह:</b>
${content.nutrition.map(point => `• ${point}`).join('\n')}

⚠️ <b>चेतावनी के संकेत:</b>
${content.warningSigns.map(point => `• ${point}`).join('\n')}
<b>इनमें से कोई भी लक्षण हो तो तुरंत डॉक्टर से मिलें!</b>

💡 <b>सामान्य सलाह:</b>
${content.generalAdvice.map(point => `• ${point}`).join('\n')}

📋 <b>डिस्क्लेमर:</b> यह केवल शिक्षा के लिए है। नियमित डॉक्टर की जांच कराते रहें।

क्या यह जानकारी उपयोगी थी?`;
        }
    }

    async sendWeeklyHealthCheck(bot, user) {
        try {
            let healthQuestions, options;
            const isEnglish = user.language === 'english';
            
            if (isEnglish) {
                healthQuestions = "🩺 Weekly Health Check\n\nHow are you feeling? Any new problems? Baby movements?";
            } else {
                healthQuestions = "🩺 साप्ताहिक स्वास्थ्य जांच\n\nआप कैसी महसूस कर रही हैं? क्या कोई नई परेशानी है? शिशु की हरकत महसूस हो रही है?";
            }

            if (user.registrationSource === 'web' && user.webPushSubscription) {
                const notificationService = require('./notificationService');
                await notificationService.sendNotification(user.webPushSubscription, {
                    title: isEnglish ? 'Health Check' : 'स्वास्थ्य जांच',
                    body: healthQuestions,
                    url: '/chat'
                });
            } else if (user.telegramId) {
                // ... telegram logic ...
                options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: isEnglish ? 'All good ✅' : 'सब ठीक है ✅', callback_data: 'health_good' },
                                { text: isEnglish ? 'Some issues 🤕' : 'कुछ परेशानी है 🤕', callback_data: 'health_issues' }
                            ]
                        ]
                    },
                    parse_mode: 'HTML'
                };
                await bot.sendMessage(user.telegramId, healthQuestions, options);
            }

            console.log(`Sent weekly health check to user ${user._id}`);
        } catch (error) {
            console.error(`Error sending health check:`, error);
        }
    }
}

module.exports = PregnancyService;