const User = require('../models/User');
const PregnancyService = require('./pregnancyService');
const KeywordService = require('./keywordService');
const { calculatePregnancyWeek, isValidDate, parseDate } = require('../utils/dateUtils');

class BotService {
    constructor(bot) {
        this.bot = bot;
        this.pregnancyService = new PregnancyService();
        this.keywordService = new KeywordService();
        this.userStates = new Map(); // Track user conversation states
    }

    initializeHandlers() {
        // Handle /start command
        this.bot.onText(/\/start/, this.handleStart.bind(this));

        // Handle "गर्भ" keyword
        this.bot.onText(/गर्भ/, this.handleGarbh.bind(this));

        // Handle all text messages
        this.bot.on('message', this.handleMessage.bind(this));

        // Handle callback queries (Yes/No feedback)
        this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    }

    async handleStart(msg) {
        const chatId = msg.chat.id;
        const firstName = msg.from.first_name || 'बहन जी';

        try {
            // Check if user already exists
            const existingUser = await User.findOne({ telegramId: chatId.toString() });

            if (existingUser) {
                await this.sendWelcomeBackMessage(chatId, firstName);
                return;
            }

            await this.sendConsentMessage(chatId, firstName);
        } catch (error) {
            console.error('Error in handleStart:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleGarbh(msg) {
        await this.handleStart(msg);
    }

    async sendConsentMessage(chatId, firstName) {
        const consentMessage = `🙏 Namaste ${firstName}! Swagat hai Sugam Garbh mein.

Main aapki garbhavastha ke dauran saptahik jaankari aur margdarshan pradan karungi.

⚠️ Mahattvpurn Suchna:
• Yeh keval shiksha ke liye hai, chikitsa salaah nahi
• Niyamit doctor ki jaanch karate rahen
• Aapatkal mein turant doctor se sampark karen

Kya aap in sharton se sahmat hain?`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Haan, main sahmat hun ✅', callback_data: 'consent_yes' },
                        { text: 'Nahi ❌', callback_data: 'consent_no' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, consentMessage, options);
    }

    async sendWelcomeBackMessage(chatId, firstName) {
        const user = await User.findOne({ telegramId: chatId.toString() });
        const currentWeek = calculatePregnancyWeek(user.dueDate);

        const message = `🙏 Namaste ${firstName}! Aapka swagat hai.

Aapki garbhavastha ka ${currentWeek}wan saptah chal raha hai.

Aap nimn mein se koi bhi sawal pooch sakti hain:
• Kabz
• Tikakaran
• Aahar
• Chinta
• Vyayam

Ya /help type karen adhik jaankari ke liye.`;

        await this.bot.sendMessage(chatId, message);
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Skip if it's a command we've already handled
        if (text === '/start' || text === 'गर्भ') return;

        try {
            const userState = this.userStates.get(chatId);

            // Handle due date input
            if (userState === 'awaiting_due_date') {
                await this.handleDueDateInput(chatId, text, msg.from);
                return;
            }

            // Handle additional info input
            if (userState === 'awaiting_additional_info') {
                await this.handleAdditionalInfo(chatId, text);
                return;
            }

            // Handle health details input
            if (userState === 'awaiting_health_details') {
                await this.handleHealthDetails(chatId, text);
                return;
            }

            // Handle keyword-based queries
            await this.handleKeywordQuery(chatId, text);

        } catch (error) {
            console.error('Error in handleMessage:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        try {
            if (data === 'consent_yes') {
                await this.requestDueDate(chatId);
            } else if (data === 'consent_no') {
                await this.bot.sendMessage(chatId, 'Samajh gaya. Yadi aap badalna chahti hain to /start phir se type karen.');
            } else if (data.startsWith('feedback_')) {
                await this.handleFeedback(chatId, data, callbackQuery.from.id);
            } else if (data.startsWith('health_')) {
                await this.handleHealthCheck(chatId, data, callbackQuery.from.id);
            }

            // Answer the callback query
            await this.bot.answerCallbackQuery(callbackQuery.id);
        } catch (error) {
            console.error('Error in handleCallbackQuery:', error);
        }
    }

    async requestDueDate(chatId) {
        this.userStates.set(chatId, 'awaiting_due_date');

        const message = `Kripaya apni garbh dharan ki tithi batayen (DD/MM/YYYY format mein):

Udaharan: 15/02/2024

Yadi aapko exact date yaad nahi hai to last periods ki date batayen.`;

        await this.bot.sendMessage(chatId, message);
    }

    async handleDueDateInput(chatId, text, userInfo) {
        const dueDate = parseDate(text);

        if (!dueDate || !isValidDate(dueDate)) {
            await this.bot.sendMessage(chatId, 'Kripaya sahi format mein tithi den (DD/MM/YYYY)\nUdaharan: 15/08/2024');
            return;
        }

        // Check if conception date is reasonable (should be in the past, within last 10 months)
        const now = new Date();
        const tenMonthsAgo = new Date(now.getTime() - (10 * 30 * 24 * 60 * 60 * 1000));

        if (dueDate > now || dueDate < tenMonthsAgo) {
            await this.bot.sendMessage(chatId, 'Kripaya ek vaidh garbh dharan tithi den (pichhle 10 mahine ke beech).');
            return;
        }

        // Save user data
        try {
            const user = new User({
                telegramId: chatId.toString(),
                firstName: userInfo.first_name || 'उपयोगकर्ता',
                username: userInfo.username,
                dueDate: dueDate,
                consentGiven: true
            });

            await user.save();

            const currentWeek = calculatePregnancyWeek(dueDate);
            const formattedDate = dueDate.toLocaleDateString('hi-IN');

            this.userStates.set(chatId, 'awaiting_additional_info');

            const message = `✅ Dhanyawad! Aapki garbh dharan tithi ${formattedDate} surakshit roop se darj kar li gayi hai.

Aapki garbhavastha ka ${currentWeek}wan saptah chal raha hai.

Ab kripaya kuch atirikt jaankari den (vaikalpik):
• Aapki umra
• Aapka shehar/gaon
• Kya yeh aapki pehli garbhavastha hai?

Ya "Choden" type karen yadi aap yeh jaankari nahi dena chahti.`;

            await this.bot.sendMessage(chatId, message);

        } catch (error) {
            console.error('Error saving user:', error);
            await this.bot.sendMessage(chatId, 'Data save karne mein truti hui. Kripaya punah prayas karen.');
        }
    }

    async handleAdditionalInfo(chatId, text) {
        if (text.toLowerCase() === 'छोड़ें' || text.toLowerCase() === 'skip') {
            await this.completeRegistration(chatId);
            return;
        }

        // Parse additional information (basic parsing)
        const user = await User.findOne({ telegramId: chatId.toString() });
        if (!user) return;

        // Simple parsing for age (look for numbers)
        const ageMatch = text.match(/(\d+)/);
        if (ageMatch) {
            user.age = parseInt(ageMatch[1]);
        }

        // Store location (everything else)
        if (text.length > 0 && !text.match(/^\d+$/)) {
            user.location = text;
        }

        await user.save();
        await this.completeRegistration(chatId);
    }

    async completeRegistration(chatId) {
        this.userStates.delete(chatId);

        const message = `🎉 Panjikaran poora hua!

Ab aapko har saptah garbhavastha ki jaankari milegi.

Aap kabhi bhi nimn sawal pooch sakti hain:
• Kabz
• Tikakaran  
• Aahar
• Chinta
• Vyayam
• Sirdard
• Ulti

Swasth rahen! 🤱`;

        await this.bot.sendMessage(chatId, message);

        // Send current week info immediately
        await this.pregnancyService.sendCurrentWeekInfo(this.bot, chatId);
    }

    async handleKeywordQuery(chatId, text) {
        const response = this.keywordService.getResponse(text);

        if (response) {
            const options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'हाँ, उपयोगी था ✅', callback_data: 'feedback_yes' },
                            { text: 'नहीं, उपयोगी नहीं था ❌', callback_data: 'feedback_no' }
                        ]
                    ]
                }
            };

            await this.bot.sendMessage(chatId, response, options);
        } else {
            const helpMessage = `Main nimn vishyon par jaankari de sakti hun:

• Kabz
• Tikakaran
• Aahar
• Chinta  
• Vyayam
• Sirdard
• Ulti
• Raktchap
• Diabetes
• Neend

Kripaya inmein se koi ek shabd type karen.`;

            await this.bot.sendMessage(chatId, helpMessage);
        }
    }

    async handleFeedback(chatId, data, userId) {
        const helpful = data === 'feedback_yes';

        try {
            await User.updateOne(
                { telegramId: chatId.toString() },
                { 
                    $push: { 
                        feedback: { 
                            helpful: helpful,
                            timestamp: new Date()
                        } 
                    } 
                }
            );

            const thankYouMessage = helpful ? 
                'Dhanyawad! Aapki pratikriya hamare liye mahattvpurn hai. 🙏' :
                'Dhanyawad! Hum behtar banne ki koshish karenge. 🙏';

            await this.bot.sendMessage(chatId, thankYouMessage);
        } catch (error) {
            console.error('Error saving feedback:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleHealthCheck(chatId, data, userId) {
        try {
            if (data === 'health_good') {
                const message = `✅ Bahut accha! Aap swasth hain.

Yaad rakhen:
• Niyamit doctor ki jaanch karayen
• Bharpur aahar len
• Achhi neend len
• Halka vyayam karen

Koi bhi pareshani ho to hmesha doctor se milen! 🩺`;

                await this.bot.sendMessage(chatId, message);
            } else if (data === 'health_issues') {
                this.userStates.set(chatId, 'awaiting_health_details');
                
                const message = `🤕 Kya pareshani ho rahi hai? Kripaya vistaar se batayen:

Jaise:
• Sir dard
• Ulti
• Pet dard
• Kamjori
• Bukhar
• Koi aur samasya

Main aapki madad karne ki koshish karungi, lekin yaad rakhen - yadi koi gambhir lakshan hai to turant doctor se milen! 🚨`;

                await this.bot.sendMessage(chatId, message);
            }

            // Save health status
            await User.updateOne(
                { telegramId: chatId.toString() },
                { 
                    $push: { 
                        healthChecks: { 
                            status: data === 'health_good' ? 'good' : 'issues',
                            timestamp: new Date()
                        } 
                    } 
                }
            );

        } catch (error) {
            console.error('Error handling health check:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleHealthDetails(chatId, text) {
        this.userStates.delete(chatId);

        try {
            // Save health details
            await User.updateOne(
                { telegramId: chatId.toString() },
                { 
                    $push: { 
                        healthChecks: { 
                            status: 'issues',
                            details: text,
                            timestamp: new Date()
                        } 
                    } 
                }
            );

            // Provide basic advice based on common symptoms
            let response = `🩺 Aapki pareshani: "${text}"\n\n`;
            
            const lowText = text.toLowerCase();
            
            if (lowText.includes('sir') || lowText.includes('headache') || lowText.includes('dard')) {
                response += `💊 Sir dard ke liye:\n• Bharpur paani piye\n• Aaraam karen\n• Thanda sekan lagaye\n• Stress kam rakhen\n\n`;
            }
            
            if (lowText.includes('ulti') || lowText.includes('vomit') || lowText.includes('nausea')) {
                response += `🤢 Ulti ke liye:\n• Thoda-thoda khaye\n• Adrak ki chai piye\n• Nimbu pani len\n• Sukhe biscuit khaye\n\n`;
            }
            
            if (lowText.includes('kabz') || lowText.includes('constipation')) {
                response += `🚽 Kabz ke liye:\n• Fiber wala khana len\n• Jyada paani piye\n• Halka vyayam karen\n• Papita, kela khaye\n\n`;
            }
            
            if (lowText.includes('kamjor') || lowText.includes('weak') || lowText.includes('thak')) {
                response += `😴 Kamjori ke liye:\n• Achhi neend len\n• Iron rich food khaye\n• Vitamin supplements len\n• Zyada aaraam karen\n\n`;
            }

            response += `⚠️ <b>Mahattvpurn:</b> Yadi lakshan badhte rahen ya tez bukhar, khoon aana, gambhir dard ho to TURANT doctor se milen!\n\n📱 Emergency: 102 (Ambulance)`;

            const options = {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'उपयोगी था ✅', callback_data: 'feedback_yes' },
                            { text: 'डॉक्टर से मिलना है 🏥', callback_data: 'need_doctor' }
                        ]
                    ]
                }
            };

            await this.bot.sendMessage(chatId, response, options);

        } catch (error) {
            console.error('Error handling health details:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }
}

module.exports = BotService;