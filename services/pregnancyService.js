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
                                { text: 'Haan, upyogi tha ✅', callback_data: 'feedback_yes' },
                                { text: 'Nahi, upyogi nahi tha ❌', callback_data: 'feedback_no' }
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
        return `🤱 <b>Garbhavastha ka ${week}wan saptah</b>

🍼 <b>Shishu ka vikas:</b>
${content.babyDevelopment.map(point => `• ${point}`).join('\n')}

👩 <b>Maa ke sharir mein badlav:</b>
${content.motherChanges.map(point => `• ${point}`).join('\n')}

🥗 <b>Poshan ki salaah:</b>
${content.nutrition.map(point => `• ${point}`).join('\n')}

⚠️ <b>Chetavni ke sanket:</b>
${content.warningSigns.map(point => `• ${point}`).join('\n')}
<b>Inmein se koi bhi lakshan ho to turant doctor se milen!</b>

💡 <b>Samanya salaah:</b>
${content.generalAdvice.map(point => `• ${point}`).join('\n')}

📋 <b>Disclaimer:</b> Yeh keval shiksha ke liye hai. Niyamit doctor ki jaanch karate rahen.

Kya yeh jaankari upyogi thi?`;
    }
}

module.exports = PregnancyService;
