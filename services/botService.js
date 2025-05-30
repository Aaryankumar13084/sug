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
        const consentMessage = `🙏 नमस्ते ${firstName}! स्वागत है सुगम गर्भ में।

मैं आपकी गर्भावस्था के दौरान सप्ताहिक जानकारी और मार्गदर्शन प्रदान करूंगी।

⚠️ महत्वपूर्ण सूचना:
• यह केवल शिक्षा के लिए है, चिकित्सा सलाह नहीं
• नियमित डॉक्टर की जांच कराते रहें
• आपातकाल में तुरंत डॉक्टर से संपर्क करें

क्या आप इन शर्तों से सहमत हैं?`;

        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'हाँ, मैं सहमत हूँ ✅', callback_data: 'consent_yes' },
                        { text: 'नहीं ❌', callback_data: 'consent_no' }
                    ]
                ]
            }
        };

        await this.bot.sendMessage(chatId, consentMessage, options);
    }

    async sendWelcomeBackMessage(chatId, firstName) {
        const user = await User.findOne({ telegramId: chatId.toString() });
        const currentWeek = calculatePregnancyWeek(user.dueDate);

        const message = `🙏 नमस्ते ${firstName}! आपका स्वागत है।

आपकी गर्भावस्था का ${currentWeek}वां सप्ताह चल रहा है।

आप निम्न में से कोई भी सवाल पूछ सकती हैं:
• कब्ज़
• टीकाकरण
• आहार
• चिंता
• व्यायाम

या /help टाइप करें अधिक जानकारी के लिए।`;

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
                await this.bot.sendMessage(chatId, 'समझ गया। यदि आप बदलना चाहती हैं तो /start फिर से टाइप करें।');
            } else if (data.startsWith('feedback_')) {
                await this.handleFeedback(chatId, data, callbackQuery.from.id);
            }

            // Answer the callback query
            await this.bot.answerCallbackQuery(callbackQuery.id);
        } catch (error) {
            console.error('Error in handleCallbackQuery:', error);
        }
    }

    async requestDueDate(chatId) {
        this.userStates.set(chatId, 'awaiting_due_date');

        const message = `कृपया अपनी अनुमानित प्रसव तिथि बताएं (DD/MM/YYYY फॉर्मेट में):

उदाहरण: 15/08/2024`;

        await this.bot.sendMessage(chatId, message);
    }

    async handleDueDateInput(chatId, text, userInfo) {
        const dueDate = parseDate(text);

        if (!dueDate || !isValidDate(dueDate)) {
            await this.bot.sendMessage(chatId, 'कृपया सही फॉर्मेट में तिथि दें (DD/MM/YYYY)\nउदाहरण: 15/08/2024');
            return;
        }

        // Check if due date is reasonable (between now and 10 months from now)
        const now = new Date();
        const maxDate = new Date(now.getTime() + (10 * 30 * 24 * 60 * 60 * 1000));

        if (dueDate < now || dueDate > maxDate) {
            await this.bot.sendMessage(chatId, 'कृपया एक वैध प्रसव तिथि दें (आज से 10 महीने के बीच)।');
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

            const message = `✅ धन्यवाद! आपकी प्रसव तिथि ${formattedDate} सुरक्षित रूप से दर्ज कर ली गई है।

आपकी गर्भावस्था का ${currentWeek}वां सप्ताह चल रहा है।

अब कृपया कुछ अतिरिक्त जानकारी दें (वैकल्पिक):
• आपकी उम्र
• आपका शहर/गांव
• क्या यह आपकी पहली गर्भावस्था है?

या "छोड़ें" टाइप करें यदि आप यह जानकारी नहीं देना चाहती।`;

            await this.bot.sendMessage(chatId, message);

        } catch (error) {
            console.error('Error saving user:', error);
            await this.bot.sendMessage(chatId, 'डेटा सेव करने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
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

        const message = `🎉 पंजीकरण पूरा हुआ!

अब आपको हर सप्ताह गर्भावस्था की जानकारी मिलेगी।

आप कभी भी निम्न सवाल पूछ सकती हैं:
• कब्ज़
• टीकाकरण  
• आहार
• चिंता
• व्यायाम
• सिरदर्द
• उल्टी

स्वस्थ रहें! 🤱`;

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
            const helpMessage = `मैं निम्न विषयों पर जानकारी दे सकती हूँ:

• कब्ज़
• टीकाकरण
• आहार
• चिंता  
• व्यायाम
• सिरदर्द
• उल्टी
• रक्तचाप
• डायबिटीज
• नींद

कृपया इनमें से कोई एक शब्द टाइप करें।`;

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
                'धन्यवाद! आपकी प्रतिक्रिया हमारे लिए महत्वपूर्ण है। 🙏' :
                'धन्यवाद! हम बेहतर बनने की कोशिश करेंगे। 🙏';

            await this.bot.sendMessage(chatId, thankYouMessage);
        } catch (error) {
            console.error('Error saving feedback:', error);
            await this.bot.sendMessage(chatId, 'Kshama karen, kuch truti hui hai. Kripaya baad mein punah prayas karen.');
        }
    }
}

module.exports = BotService;