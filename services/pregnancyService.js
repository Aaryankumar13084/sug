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
                const content = getWeeklyContent(currentWeek);
                
                if (content) {
                    const message = this.formatWeeklyMessage(currentWeek, content);
                    
                    const options = {
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
                    
                    await bot.sendMessage(user.telegramId, message, options);
                    
                    // Update last week sent
                    user.lastWeekSent = currentWeek;
                    await user.save();
                    
                    console.log(`Sent week ${currentWeek} update to user ${user.telegramId}`);
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
            const content = getWeeklyContent(currentWeek);
            
            if (content && currentWeek >= 1 && currentWeek <= 42) {
                const message = this.formatWeeklyMessage(currentWeek, content);
                
                const options = {
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
                
                await bot.sendMessage(chatId, message, options);
                
                // Update last week sent
                user.lastWeekSent = currentWeek;
                await user.save();
            }
        } catch (error) {
            console.error('Error in sendCurrentWeekInfo:', error);
        }
    }

    formatWeeklyMessage(week, content) {
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

module.exports = PregnancyService;
