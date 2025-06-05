const User = require('../models/User');
const { calculatePregnancyWeek } = require('../utils/dateUtils');
const { getWeeklyContent } = require('../data/pregnancyWeeks');

class PregnancyService {
    async sendWeeklyUpdates(bot) {
        try {
            const users = await User.find({ isActive: true });
            console.log(`Checking weekly updates for ${users.length} users...`);

            for (const user of users) {
                await this.checkAndSendWeeklyUpdate(bot, user);
            }
        } catch (error) {
            console.error('Error in sendWeeklyUpdates:', error);
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
            console.error('Error in sendCurrentWeekInfo:', error);
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
            const currentWeek = calculatePregnancyWeek(user.dueDate);

            let healthQuestions, options;

            if (user.language === 'english') {
                healthQuestions = [
                    "🩺 <b>Weekly Health Check</b>",
                    "",
                    "Please answer the following questions:",
                    "",
                    "1️⃣ How are you feeling?",
                    "2️⃣ Are you experiencing any new problems?", 
                    "3️⃣ Are you eating and drinking properly?",
                    "4️⃣ Are you sleeping well?",
                    "5️⃣ Can you feel baby's movements? (after 20 weeks)",
                    "",
                    "You can say 'All good' or describe any concerns."
                ].join('\n');

                options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'All good ✅', callback_data: 'health_good' },
                                { text: 'Some issues 🤕', callback_data: 'health_issues' }
                            ]
                        ]
                    },
                    parse_mode: 'HTML'
                };
            } else {
                healthQuestions = [
                    "🩺 <b>साप्ताहिक स्वास्थ्य जांच</b>",
                    "",
                    "कृपया निम्न प्रश्नों का उत्तर दें:",
                    "",
                    "1️⃣ आप कैसी महसूस कर रही हैं?",
                    "2️⃣ क्या आपको कोई नई परेशानी हो रही है?", 
                    "3️⃣ भोजन और पानी का सेवन सही से हो रहा है?",
                    "4️⃣ नींद अच्छी आ रही है?",
                    "5️⃣ शिशु की हरकत महसूस हो रही है? (20 सप्ताह के बाद)",
                    "",
                    "आप 'सब ठीक है' या अपनी परेशानी बता सकती हैं।"
                ].join('\n');

                options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'सब ठीक है ✅', callback_data: 'health_good' },
                                { text: 'कुछ परेशानी है 🤕', callback_data: 'health_issues' }
                            ]
                        ]
                    },
                    parse_mode: 'HTML'
                };
            }

            await bot.sendMessage(user.telegramId, healthQuestions, options);

            console.log(`Sent weekly health check to user ${user.telegramId}`);
        } catch (error) {
            console.error(`Error sending health check to user ${user.telegramId}:`, error);
        }
    }
}

module.exports = PregnancyService;