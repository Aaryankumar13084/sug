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
        const firstName = msg.from.first_name || 'Sister';

        try {
            // Check if user already exists
            const existingUser = await User.findOne({ telegramId: chatId.toString() });

            if (existingUser) {
                await this.sendWelcomeBackMessage(chatId, firstName, existingUser.language);
                return;
            }

            // Ask for language selection for new users
            await this.sendLanguageSelection(chatId, firstName);
        } catch (error) {
            console.error('Error in handleStart:', error);
            await this.bot.sendMessage(chatId, 'Sorry, there was an error. Please try again later. / Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleGarbh(msg) {
        await this.handleStart(msg);
    }

    async sendLanguageSelection(chatId, firstName) {
        const message = `🙏 Namaste ${firstName}! Welcome to Sugam Garbh!

Please choose your preferred language:
कृपया अपनी पसंदीदा भाषा चुनें:`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'हिंदी 🇮🇳', callback_data: 'lang_hindi' },
                        { text: 'English 🇺🇸', callback_data: 'lang_english' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, message, options);
    }

    async sendConsentMessage(chatId, firstName, language = 'hindi') {
        let consentMessage, options;

        if (language === 'english') {
            consentMessage = `🙏 Welcome ${firstName}! Welcome to Sugam Garbh.

I will provide weekly information and guidance during your pregnancy.

⚠️ Important Notice:
• This is for educational purposes only, not medical advice
• Continue regular doctor check-ups
• Contact doctor immediately in emergencies

Do you agree to these terms?`;

            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Yes, I agree ✅', callback_data: 'consent_yes' },
                            { text: 'No ❌', callback_data: 'consent_no' }
                        ]
                    ]
                }
            };
        } else {
            consentMessage = `🙏 Namaste ${firstName}! Swagat hai Sugam Garbh mein.

Main aapki garbhavastha ke dauran saptahik jaankari aur margdarshan pradan karungi.

⚠️ Mahattvpurn Suchna:
• Yeh keval shiksha ke liye hai, chikitsa salaah nahi
• Niyamit doctor ki jaanch karate rahen
• Aapatkal mein turant doctor se sampark karen

Kya aap in sharton se sahmat hain?`;

            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'Haan, main sahmat hun ✅', callback_data: 'consent_yes' },
                            { text: 'Nahi ❌', callback_data: 'consent_no' }
                        ]
                    ]
                }
            };
        }

        await this.bot.sendMessage(chatId, consentMessage, options);
    }

    async sendWelcomeBackMessage(chatId, firstName, language = 'hindi') {
        const user = await User.findOne({ telegramId: chatId.toString() });
        const currentWeek = calculatePregnancyWeek(user.dueDate);

        let message;
        if (language === 'english') {
            message = `🙏 Welcome back ${firstName}!

You are currently in week ${currentWeek} of your pregnancy.

You can ask me about any of these topics:
• Constipation
• Vaccination
• Diet
• Anxiety
• Exercise

Or type /help for more information.`;
        } else {
            message = `🙏 Namaste ${firstName}! Aapka swagat hai.

Aapki garbhavastha ka ${currentWeek}wan saptah chal raha hai.

Aap nimn mein se koi bhi sawal pooch sakti hain:
• Kabz
• Tikakaran
• Aahar
• Chinta
• Vyayam

Ya /help type karen adhik jaankari ke liye.`;
        }

        await this.bot.sendMessage(chatId, message);
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Skip if it's a command we've already handled
        if (text === '/start' || text === 'गर्भ') return;

        try {
            const userState = this.userStates.get(chatId);
            const currentState = userState?.state || userState;
            const language = userState?.language || 'hindi';

            // Handle due date input
            if (currentState === 'awaiting_due_date') {
                await this.handleDueDateInput(chatId, text, msg.from, language);
                return;
            }

            // Handle additional info input
            if (currentState === 'awaiting_additional_info') {
                await this.handleAdditionalInfo(chatId, text, language);
                return;
            }

            // Handle health details input
            if (currentState === 'awaiting_health_details') {
                await this.handleHealthDetails(chatId, text, language);
                return;
            }

            // Handle keyword-based queries
            await this.handleKeywordQuery(chatId, text);

        } catch (error) {
            console.error('Error in handleMessage:', error);
            const userState = this.userStates.get(chatId);
            const language = userState?.language || 'hindi';
            
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Sorry, there was an error. Please try again later.');
            } else {
                await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
            }
        }
    }

    async handleCallbackQuery(callbackQuery) {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;
        const firstName = callbackQuery.from.first_name || 'Sister';

        try {
            if (data === 'lang_hindi') {
                this.userStates.set(chatId, { language: 'hindi' });
                await this.sendConsentMessage(chatId, firstName, 'hindi');
            } else if (data === 'lang_english') {
                this.userStates.set(chatId, { language: 'english' });
                await this.sendConsentMessage(chatId, firstName, 'english');
            } else if (data === 'consent_yes') {
                const userState = this.userStates.get(chatId) || { language: 'hindi' };
                await this.requestDueDate(chatId, userState.language);
            } else if (data === 'consent_no') {
                const userState = this.userStates.get(chatId) || { language: 'hindi' };
                if (userState.language === 'english') {
                    await this.bot.sendMessage(chatId, 'Understood. If you want to change your mind, type /start again.');
                } else {
                    await this.bot.sendMessage(chatId, 'Samajh gaya. Yadi aap badalna chahti hain to /start phir se type karen.');
                }
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

    async requestDueDate(chatId, language = 'hindi') {
        const currentState = this.userStates.get(chatId) || {};
        this.userStates.set(chatId, { ...currentState, state: 'awaiting_due_date', language });

        let message;
        if (language === 'english') {
            message = `Please provide your conception date (DD/MM/YYYY format):

Example: 15/02/2024

If you don't remember the exact date, please provide your last period date.`;
        } else {
            message = `Kripaya apni garbh dharan ki tithi batayen (DD/MM/YYYY format mein):

Udaharan: 15/02/2024

Yadi aapko exact date yaad nahi hai to last periods ki date batayen.`;
        }

        await this.bot.sendMessage(chatId, message);
    }

    async handleDueDateInput(chatId, text, userInfo, language = 'hindi') {
        const dueDate = parseDate(text);

        if (!dueDate || !isValidDate(dueDate)) {
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Please provide date in correct format (DD/MM/YYYY)\nExample: 15/08/2024');
            } else {
                await this.bot.sendMessage(chatId, 'Kripaya sahi format mein tithi den (DD/MM/YYYY)\nUdaharan: 15/08/2024');
            }
            return;
        }

        // Check if conception date is reasonable (should be in the past, within last 10 months)
        const { isValidConceptionDate } = require('../utils/dateUtils');
        
        if (!isValidConceptionDate(dueDate)) {
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Please provide a valid conception date (in the past and within last 10 months).\nExample: 15/08/2024');
            } else {
                await this.bot.sendMessage(chatId, 'Kripaya ek vaidh garbh dharan tithi den (aaj se pehle aur pichhle 10 mahine ke beech). \nUdaharan: 15/08/2024');
            }
            return;
        }

        // Save user data
        try {
            const user = new User({
                telegramId: chatId.toString(),
                firstName: userInfo.first_name || (language === 'english' ? 'User' : 'उपयोगकर्ता'),
                username: userInfo.username,
                dueDate: dueDate,
                consentGiven: true,
                language: language
            });

            await user.save();

            const currentWeek = calculatePregnancyWeek(dueDate);
            const formattedDate = dueDate.toLocaleDateString('hi-IN');

            const currentState = this.userStates.get(chatId) || {};
            this.userStates.set(chatId, { ...currentState, state: 'awaiting_additional_info', language });

            let message;
            if (language === 'english') {
                message = `✅ Thank you! Your conception date ${formattedDate} has been saved securely.

You are currently in week ${currentWeek} of your pregnancy.

Now please provide some additional information (optional):
• Your age
• Your city/town
• Is this your first pregnancy?

Or type "Skip" if you don't want to provide this information.`;
            } else {
                message = `✅ Dhanyawad! Aapki garbh dharan tithi ${formattedDate} surakshit roop se darj kar li gayi hai.

Aapki garbhavastha ka ${currentWeek}wan saptah chal raha hai.

Ab kripaya kuch atirikt jaankari den (vaikalpik):
• Aapki umra
• Aapka shehar/gaon
• Kya yeh aapki pehli garbhavastha hai?

Ya "Skip" type karen yadi aap yeh jaankari nahi dena chahti.`;
            }

            await this.bot.sendMessage(chatId, message);

        } catch (error) {
            console.error('Error saving user:', error);
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Error saving data. Please try again.');
            } else {
                await this.bot.sendMessage(chatId, 'Data save karne mein truti hui. Kripaya punah prayas karen.');
            }
        }
    }

    async handleAdditionalInfo(chatId, text, language = 'hindi') {
        if (text.toLowerCase() === 'skip' || text.toLowerCase() === 'छोड़ें') {
            await this.completeRegistration(chatId, language);
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
        await this.completeRegistration(chatId, language);
    }

    async completeRegistration(chatId, language = 'hindi') {
        this.userStates.delete(chatId);

        let message;
        if (language === 'english') {
            message = `🎉 Registration complete!

You will now receive weekly pregnancy information.

You can ask me about any of these topics anytime:
• Constipation
• Vaccination
• Diet
• Anxiety
• Exercise
• Headache
• Vomiting

Stay healthy! 🤱`;
        } else {
            message = `🎉 Panjikaran poora hua!

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
        }

        await this.bot.sendMessage(chatId, message);

        // Send current week info immediately
        await this.pregnancyService.sendCurrentWeekInfo(this.bot, chatId);
    }

    async handleKeywordQuery(chatId, text) {
        // Get user's language preference
        const user = await User.findOne({ telegramId: chatId.toString() });
        const language = user?.language || 'hindi';
        
        const response = this.keywordService.getResponse(text, language);

        if (response) {
            let options;
            if (language === 'english') {
                options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Yes, helpful ✅', callback_data: 'feedback_yes' },
                                { text: 'No, not helpful ❌', callback_data: 'feedback_no' }
                            ]
                        ]
                    }
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
                    }
                };
            }

            await this.bot.sendMessage(chatId, response, options);
        } else {
            let helpMessage;
            if (language === 'english') {
                helpMessage = `I can provide information on the following topics:

• Constipation
• Vaccination
• Diet
• Anxiety
• Exercise
• Headache
• Vomiting
• Blood Pressure
• Diabetes
• Sleep

Please type one of these words.`;
            } else {
                helpMessage = `Main nimn vishyon par jaankari de sakti hun:

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
            }

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