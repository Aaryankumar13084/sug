const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const PregnancyService = require('./pregnancyService');
const KeywordService = require('./keywordService');
const GeminiService = require('./geminiService');
const { calculatePregnancyWeek, isValidDate, parseDate, isValidConceptionDate } = require('../utils/dateUtils');

class BotService {
    constructor(bot) {
        this.bot = bot;
        this.pregnancyService = new PregnancyService();
        this.keywordService = new KeywordService();
        this.geminiService = new GeminiService();
        this.userStates = new Map(); // Track user conversation states
        this.webSessions = new Map(); // Track web chat conversation history
    }

    async handleWebMessage(message, language, sessionId, chatSessionId) {
        try {
            // Map short language codes to full names used by services
            const langFull = language === 'en' ? 'english' : 'hindi';

            // Check if user is in registration flow
            const userState = this.userStates.get(sessionId);
            if (userState) {
                if (userState.state === 'awaiting_consent') {
                    if (message.toLowerCase().includes('yes') || message.includes('हाँ') || message.includes('agree')) {
                        return await this.requestWebDueDate(sessionId, langFull);
                    } else {
                        return langFull === 'english' ? 'Registration cancelled. Type "start" to try again.' : 'पंजीकरण रद्द कर दिया गया। फिर से शुरू करने के लिए "शुरू" लिखें।';
                    }
                }
                if (userState.state === 'awaiting_due_date') {
                    return await this.handleWebDueDateInput(sessionId, message, langFull);
                }
            }

            // Start registration if keywords detected
            const startKeywords = ['start', 'hi', 'hello', 'namaste', 'नमस्ते', 'शुरू', 'register', 'पंजीकरण', 'registration', 'panjikaran', 'panjikarn', 'shuru'];
            if (startKeywords.includes(message.toLowerCase())) {
                // Check if user is already registered in this session
                try {
                    const existingUser = await User.findOne({ sessionId: sessionId });
                    if (existingUser) {
                        return langFull === 'english'
                            ? `Welcome back, ${existingUser.firstName}! How can I assist you with your pregnancy today?`
                            : `वापसी पर स्वागत है, ${existingUser.firstName}! आज मैं आपकी गर्भावस्था में कैसे सहायता कर सकती हूँ?`;
                    }
                } catch (e) {
                    console.error('Error checking user session:', e);
                }

                const formHtml = `
<div class="reg-form-container">
    <h4>${langFull === 'english' ? 'Registration' : 'पंजीकरण'}</h4>
    <form onsubmit="submitRegistrationForm(event)">
        <div class="reg-form-group">
            <label>${langFull === 'english' ? 'First Name' : 'पहला नाम'}</label>
            <input type="text" name="firstName" required placeholder="${langFull === 'english' ? 'Your name' : 'आपका नाम'}">
        </div>
        <div class="reg-form-group">
            <label>${langFull === 'english' ? 'Conception Date' : 'गर्भधारण की तिथि'}</label>
            <input type="text" name="conceptionDate" required placeholder="DD/MM/YYYY">
        </div>
        <button type="submit" class="reg-submit-btn">${langFull === 'english' ? 'Register Now' : 'अभी पंजीकरण करें'}</button>
    </form>
</div>
`;
                return formHtml;
            }

            // Simple keyword check first
            const keywordResponse = await this.keywordService.getResponse(message, langFull);
            if (keywordResponse) return keywordResponse;

            // Get conversation history from the specific ChatSession
            let sessionDoc = null;
            let history = [];

            if (chatSessionId) {
                try {
                    sessionDoc = await ChatSession.findById(chatSessionId);
                    if (sessionDoc) {
                        // Extract just the question/answer format for the AI context
                        for (let i = 0; i < sessionDoc.messages.length - 1; i += 2) {
                            if (sessionDoc.messages[i].role === 'user' && sessionDoc.messages[i + 1] && sessionDoc.messages[i + 1].role === 'model') {
                                history.push({
                                    question: sessionDoc.messages[i].text,
                                    answer: sessionDoc.messages[i + 1].text
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error fetching chat session history:', e);
                }
            } else {
                // Fallback to in-memory session history if no DB ID provided
                history = sessionId ? (this.webSessions.get(sessionId) || []) : [];
            }

            // Generate AI response with conversation history
            const aiResponse = await this.geminiService.generateResponse(message, langFull, history);

            // Save to DB session history
            if (chatSessionId && sessionDoc) {
                try {
                    // Save user message
                    sessionDoc.messages.push({ role: 'user', text: message });
                    // Save model response
                    sessionDoc.messages.push({ role: 'model', text: aiResponse });
                    await sessionDoc.save();
                } catch (dbError) {
                    console.error('Error saving messages to ChatSession:', dbError);
                }
            } else if (sessionId) {
                // Keep minimal in-memory history if no persistent session
                history.push({ question: message, answer: aiResponse });
                if (history.length > 10) history.shift();
                this.webSessions.set(sessionId, history);
            }

            return aiResponse;
        } catch (error) {
            console.error('Web Message Error:', error);
            return language === 'hi' ? 'क्षमा करें, मैं अभी जवाब नहीं दे सकता।' : 'Sorry, I cannot respond right now.';
        }
    }

    async requestWebDueDate(sessionId, language) {
        this.userStates.set(sessionId, { state: 'awaiting_due_date', language });
        return language === 'english'
            ? 'Please provide your conception date (DD/MM/YYYY):'
            : 'कृपया अपनी गर्भ धारण की तिथि बताएं (DD/MM/YYYY):';
    }

    async handleWebDueDateInput(sessionId, text, language) {
        const dueDate = parseDate(text);
        if (!dueDate || !isValidDate(dueDate) || !isValidConceptionDate(dueDate)) {
            return language === 'english'
                ? 'Invalid date. Please use DD/MM/YYYY format and ensure the date is within the last 10 months.'
                : 'अमान्य तिथि। कृपया DD/MM/YYYY प्रारूप का उपयोग करें और सुनिश्चित करें कि तिथि पिछले 10 महीनों के भीतर है।';
        }

        const user = new User({
            firstName: 'Web User',
            dueDate: dueDate,
            consentGiven: true,
            language: language,
            registrationSource: 'web'
        });
        await user.save();
        this.userStates.delete(sessionId);

        return language === 'english'
            ? 'Registration complete! You will now receive weekly updates.'
            : 'पंजीकरण पूरा हुआ! अब आपको साप्ताहिक अपडेट मिलेंगे।';
    }

    initializeHandlers() {
        // Handle /start command
        this.bot.onText(/\/start/, this.handleStart.bind(this));

        // Handle /help command
        this.bot.onText(/\/help/, this.handleHelp.bind(this));

        // Handle /ask command for Gemini AI responses
        this.bot.onText(/\/ask (.+)/, this.handleAskCommand.bind(this));

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

    async handleHelp(msg) {
        const chatId = msg.chat.id;

        try {
            // Get user's language preference
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

            let helpMessage;
            if (language === 'english') {
                helpMessage = `🤖 <b>Sugam Garbh Bot Help</b>

<b>📋 Available Commands:</b>
• /start - Start using the bot or restart registration
• /help - Show this help message

<b>🤱 What I can help you with:</b>
• <b>Automatic AI Responses:</b> Just type any pregnancy-related question and I'll respond intelligently using your conversation history
• <b>Weekly Updates:</b> Get weekly pregnancy information based on your due date
• <b>Health Checks:</b> Receive weekly health check reminders

<b>💡 Common Topics:</b>
• Diet and nutrition during pregnancy
• Exercise and fitness recommendations
• Managing morning sickness and discomfort
• Vaccination schedule
• Baby development information
• Emotional support and anxiety management
• Sleep issues during pregnancy
• Warning signs to watch for

<b>🌟 Features:</b>
• Bilingual support (Hindi/English)
• Personalized responses based on your pregnancy week
• Context-aware AI using your previous questions
• Secure data encryption
• Feedback system to improve responses

<b>🆘 Emergency:</b>
If you have severe symptoms, contact your doctor immediately or call emergency services (102).

Just type your question naturally - no commands needed!`;
            } else {
                helpMessage = `🤖 <b>सुगम गर्भ बॉट सहायता</b>

<b>📋 उपलब्ध कमांड:</b>
• /start - बॉट का उपयोग शुरू करें या पंजीकरण फिर से करें
• /help - यह सहायता संदेश दिखाएं

<b>🤱 मैं आपकी कैसे मदद कर सकती हूं:</b>
• <b>स्वचालित AI प्रतिक्रियाएं:</b> बस कोई भी गर्भावस्था संबंधी प्रश्न टाइप करें और मैं आपके बातचीत के इतिहास का उपयोग करके समझदारी से जवाब दूंगी
• <b>साप्ताहिक अपडेट:</b> आपकी प्रसव तिथि के आधार पर साप्ताहिक गर्भावस्था की जानकारी प्राप्त करें
• <b>स्वास्थ्य जांच:</b> साप्ताहिक स्वास्थ्य जांच रिमाइंडर प्राप्त करें

<b>💡 सामान्य विषय:</b>
• गर्भावस्था के दौरान आहार और पोषण
• व्यायाम और फिटनेस सुझाव
• मॉर्निंग सिकनेस और परेशानी का प्रबंधन
• टीकाकरण कार्यक्रम
• बच्चे के विकास की जानकारी
• भावनात्मक सहायता और चिंता प्रबंधन
• गर्भावस्था के दौरान नींद की समस्याएं
• देखने योग्य चेतावनी संकेत

<b>🌟 विशेषताएं:</b>
• द्विभाषी समर्थन (हिंदी/अंग्रेजी)
• आपके गर्भावस्था सप्ताह के आधार पर व्यक्तिगत प्रतिक्रियाएं
• आपके पिछले प्रश्नों का उपयोग करके संदर्भ-जागरूक AI
• सुरक्षित डेटा एन्क्रिप्शन
• प्रतिक्रियाओं को बेहतर बनाने के लिए फीडबैक सिस्टम

<b>🆘 आपातकाल:</b>
यदि आपको गंभीर लक्षण हैं, तो तुरंत अपने डॉक्टर से संपर्क करें या आपातकालीन सेवाओं (102) पर कॉल करें।

बस अपना प्रश्न सामान्य रूप से टाइप करें - किसी कमांड की आवश्यकता नहीं!`;
            }

            await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'HTML' });

        } catch (error) {
            console.error('Error in handleHelp:', error);
            await this.bot.sendMessage(chatId, 'Sorry, there was an error showing help. Please try again later. / Kshama karen, help dikhane mein truti hui. Kripaya baad mein punah prayas karen.');
        }
    }

    async handleAskCommand(msg, match) {
        const chatId = msg.chat.id;
        const userQuestion = match[1]; // Extract the text after /ask

        try {
            // Get user's language preference
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user ? user.language : 'hindi';

            // Send typing indicator
            await this.bot.sendChatAction(chatId, 'typing');

            // Add desi nuskhe and short-answer instructions
            const responseStyleNote = language === 'english'
                ? '\n\nIMPORTANT: Prioritize home remedies and natural solutions. Do NOT suggest medicines unless I specifically ask for medicine. Keep your answer SHORT (3-5 bullet points). Only give detailed answer if I ask for more detail.'
                : '\n\nमहत्वपूर्ण: पहले देसी नुस्खे और घरेलू उपाय बताएं। दवाई तभी बताएं जब मैं खुद पूछूं। छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब मैं कहूं।';

            // Generate response using Gemini API
            const response = await this.geminiService.generateResponse(userQuestion + responseStyleNote, language);

            // Send the AI-generated response with clean formatting
            const formattedResponse = language === 'english'
                ? `🤖 AI Assistant:\n\n${response}`
                : `🤖 AI सहायक:\n\n${response}`;

            await this.bot.sendMessage(chatId, formattedResponse, { parse_mode: 'HTML' });

        } catch (error) {
            console.error('Error in handleMeekCommand:', error);
            const errorMessage = user && user.language === 'english'
                ? 'Sorry, I could not process your request. Please try again later.'
                : 'क्षमा करें, मैं आपका अनुरोध संसाधित नहीं कर सका। कृपया बाद में पुनः प्रयास करें।';
            await this.bot.sendMessage(chatId, errorMessage);
        }
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
            consentMessage = `🙏 नमस्ते ${firstName}! स्वागत है सुगम गर्भ में।

मैं आपकी गर्भावस्था के दौरान साप्ताहिक जानकारी और मार्गदर्शन प्रदान करूंगी।

⚠️ महत्वपूर्ण सूचना:
• यह केवल शिक्षा के लिए है, चिकित्सा सलाह नहीं
• नियमित डॉक्टर की जांच कराते रहें
• आपातकाल में तुरंत डॉक्टर से संपर्क करें

क्या आप इन शर्तों से सहमत हैं?`;

            options = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: 'हाँ, मैं सहमत हूँ ✅', callback_data: 'consent_yes' },
                            { text: 'नहीं ❌', callback_data: 'consent_no' }
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
            message = `🙏 नमस्ते ${firstName}! आपका स्वागत है।

आपकी गर्भावस्था का ${currentWeek}वां सप्ताह चल रहा है।

आप निम्न में से कोई भी सवाल पूछ सकती हैं:
• कब्ज
• टीकाकरण
• आहार
• चिंता
• व्यायाम

या /help टाइप करें अधिक जानकारी के लिए।`;
        }

        await this.bot.sendMessage(chatId, message);
    }

    async handleMessage(msg) {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Skip if it's a command we've already handled
        if (text === '/start' || text === '/help' || text === 'गर्भ' || text.startsWith('/ask')) return;

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

            // Handle automatic AI response for registered users
            const user = await User.findOne({ telegramId: chatId.toString() });
            if (user && user.consentGiven) {
                await this.handleAutomaticAIResponse(chatId, text, user);
            } else {
                // For unregistered users, check if they sent a start keyword
                const startKeywords = ['start', 'hi', 'hello', 'namaste', 'नमस्ते', 'शुरू', 'register', 'पंजीकरण', 'registration', 'panjikaran', 'panjikarn', 'shuru'];
                if (startKeywords.includes(text.toLowerCase().trim())) {
                    await this.handleStart(msg);
                } else {
                    // Handle keyword-based queries for unregistered users
                    await this.handleKeywordQuery(chatId, text);
                }
            }

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
        const messageId = callbackQuery.message.message_id;

        try {
            // Remove buttons after user responds
            await this.removeButtons(chatId, messageId);

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
                    await this.bot.sendMessage(chatId, 'समझ गया। यदि आप बदलना चाहती हैं तो /start फिर से टाइप करें।');
                }
            } else if (data.startsWith('feedback_')) {
                await this.handleFeedback(chatId, data, callbackQuery.from.id);
            } else if (data.startsWith('health_')) {
                await this.handleHealthCheck(chatId, data, callbackQuery.from.id);
            } else if (data === 'need_doctor') {
                const user = await User.findOne({ telegramId: chatId.toString() });
                const language = user?.language || 'hindi';

                let doctorMessage;
                if (language === 'english') {
                    doctorMessage = `🏥 <b>Contact your doctor immediately!</b>

📞 <b>Emergency Numbers:</b>
• Ambulance: 102
• Women Helpline: 1091
• Medical Emergency: 108

🩺 <b>Visit nearest hospital if you have:</b>
• Heavy bleeding
• Severe abdominal pain  
• High fever
• Continuous vomiting
• Severe headache
• Blurred vision

<b>Your health and baby's health is most important!</b>`;
                } else {
                    doctorMessage = `🏥 <b>तुरंत डॉक्टर से मिलें!</b>

📞 <b>आपातकालीन नंबर:</b>
• एम्बुलेंस: 102
• महिला हेल्पलाइन: 1091
• मेडिकल एमर्जेंसी: 108

🩺 <b>निकटतम अस्पताल जाएं अगर:</b>
• अधिक खून बह रहा हो
• पेट में तेज दर्द हो
• तेज बुखार हो
• लगातार उल्टी हो रही हो
• गंभीर सिरदर्द हो
• धुंधला दिखाई दे रहा हो

<b>आपकी और आपके बच्चे की सेहत सबसे महत्वपूर्ण है!</b>`;
                }

                await this.bot.sendMessage(chatId, doctorMessage, { parse_mode: 'HTML' });
            }

            // Answer the callback query
            await this.bot.answerCallbackQuery(callbackQuery.id);
        } catch (error) {
            console.error('Error in handleCallbackQuery:', error);
        }
    }

    async removeButtons(chatId, messageId) {
        try {
            await this.bot.editMessageReplyMarkup(
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

    async requestDueDate(chatId, language = 'hindi') {
        const currentState = this.userStates.get(chatId) || {};
        this.userStates.set(chatId, { ...currentState, state: 'awaiting_due_date', language });

        let message;
        if (language === 'english') {
            message = `Please provide your conception date (DD/MM/YYYY format):

Example: 15/02/2024

If you don't remember the exact date, please provide your last period date.`;
        } else {
            message = `कृपया अपनी गर्भ धारण की तिथि बताएं (DD/MM/YYYY प्रारूप में):

उदाहरण: 15/02/2024

यदि आपको सटीक तारीख याद नहीं है तो अंतिम मासिक धर्म की तारीख बताएं।`;
        }

        await this.bot.sendMessage(chatId, message);
    }

    async handleDueDateInput(chatId, text, userInfo, language = 'hindi') {
        const dueDate = parseDate(text);

        if (!dueDate || !isValidDate(dueDate)) {
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Please provide date in correct format (DD/MM/YYYY)\nExample: 15/08/2024');
            } else {
                await this.bot.sendMessage(chatId, 'कृपया सही प्रारूप में तिथि दें (DD/MM/YYYY)\nउदाहरण: 15/08/2024');
            }
            return;
        }

        // Check if conception date is reasonable (should be in the past, within last 10 months)
        if (!isValidConceptionDate(dueDate)) {
            if (language === 'english') {
                await this.bot.sendMessage(chatId, 'Please provide a valid conception date (within the last 10 months).\nExample: 15/08/2024');
            } else {
                await this.bot.sendMessage(chatId, 'कृपया एक मान्य गर्भ धारण तिथि दें (पिछले 10 महीनों के भीतर)।\nउदाहरण: 15/08/2024');
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
                message = `✅ धन्यवाद! आपकी गर्भ धारण तिथि ${formattedDate} सुरक्षित रूप से दर्ज कर ली गई है।

आपकी गर्भावस्था का ${currentWeek}वां सप्ताह चल रहा है।

अब कृपया कुछ अतिरिक्त जानकारी दें (वैकल्पिक):
• आपकी उम्र
• आपका शहर/गांव
• क्या यह आपकी पहली गर्भावस्था है?

या "Skip" टाइप करें यदि आप यह जानकारी नहीं देना चाहती।`;
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
            message = `🎉 पंजीकरण पूरा हुआ!

अब आपको हर सप्ताह गर्भावस्था की जानकारी मिलेगी।

आप कभी भी निम्न सवाल पूछ सकती हैं:
• कब्ज
• टीकाकरण
• आहार
• चिंता
• व्यायाम
• सिरदर्द
• उल्टी

स्वस्थ रहें! 🤱`;
        }

        await this.bot.sendMessage(chatId, message);

        // Send current week info immediately
        await this.pregnancyService.sendCurrentWeekInfo(this.bot, chatId);
    }

    async handleAutomaticAIResponse(chatId, text, user) {
        try {
            // Send typing indicator
            await this.bot.sendChatAction(chatId, 'typing');

            // Get the last 3 questions from conversation history for context
            const recentHistory = user.conversationHistory.slice(-3);

            // Build context from previous conversations
            let contextPrompt = '';
            if (recentHistory.length > 0) {
                contextPrompt = user.language === 'english'
                    ? '\n\nPrevious conversation context:\n'
                    : '\n\nपिछली बातचीत का संदर्भ:\n';

                recentHistory.forEach((entry, index) => {
                    contextPrompt += user.language === 'english'
                        ? `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}\n\n`
                        : `प्र${index + 1}: ${entry.question}\nउ${index + 1}: ${entry.answer}\n\n`;
                });
            }

            // Add user's pregnancy week context
            const currentWeek = calculatePregnancyWeek(user.dueDate);
            const pregnancyContext = user.language === 'english'
                ? `\n\nCurrent pregnancy context: The user is in week ${currentWeek} of pregnancy.`
                : `\n\nवर्तमान गर्भावस्था संदर्भ: उपयोगकर्ता गर्भावस्था के ${currentWeek}वें सप्ताह में है।`;

            // Add desi nuskhe and short-answer instructions
            const responseStyleContext = user.language === 'english'
                ? '\n\nIMPORTANT: Prioritize home remedies and natural solutions. Do NOT suggest medicines unless I specifically ask for medicine. Keep your answer SHORT (3-5 bullet points). Only give detailed answer if I ask for more detail.'
                : '\n\nमहत्वपूर्ण: पहले देसी नुस्खे और घरेलू उपाय बताएं। दवाई तभी बताएं जब मैं खुद पूछूं। छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब मैं कहूं।';

            // Create the full prompt with context
            const fullQuestion = text + contextPrompt + pregnancyContext + responseStyleContext;

            // Generate response using Gemini API with context
            const response = await this.geminiService.generateResponse(fullQuestion, user.language);

            // Store the conversation in history (keep only last 3)
            const conversationEntry = {
                question: text,
                answer: response,
                timestamp: new Date()
            };

            // Add to conversation history and limit to last 3 entries
            user.conversationHistory.push(conversationEntry);
            if (user.conversationHistory.length > 3) {
                user.conversationHistory = user.conversationHistory.slice(-3);
            }

            await user.save();

            // Send the AI-generated response with feedback buttons
            const formattedResponse = user.language === 'english'
                ? `🤖 AI Assistant:\n\n${response}`
                : `🤖 AI सहायक:\n\n${response}`;

            const options = {
                reply_markup: {
                    inline_keyboard: [
                        user.language === 'english'
                            ? [
                                { text: 'Yes, helpful ✅', callback_data: 'feedback_yes' },
                                { text: 'No, not helpful ❌', callback_data: 'feedback_no' }
                            ]
                            : [
                                { text: 'हाँ, उपयोगी था ✅', callback_data: 'feedback_yes' },
                                { text: 'नहीं, उपयोगी नहीं था ❌', callback_data: 'feedback_no' }
                            ]
                    ]
                },
                parse_mode: 'HTML'
            };

            await this.bot.sendMessage(chatId, formattedResponse, options);

        } catch (error) {
            console.error('Error in handleAutomaticAIResponse:', error);

            // Fallback to keyword-based response if AI fails
            await this.handleKeywordQuery(chatId, text);
        }
    }

    async handleKeywordQuery(chatId, text) {
        // Get user's language preference
        const user = await User.findOne({ telegramId: chatId.toString() });
        const language = user?.language || 'hindi';

        // Always use user's preferred language, regardless of input text language
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
                helpMessage = `मैं निम्न विषयों पर जानकारी दे सकती हूँ:

• कब्ज
• टीकाकरण
• आहार
• चिंता
• व्यायाम
• सिरदर्द
• उल्टी
• रक्तचाप
• मधुमेह
• नींद

कृपया इनमें से कोई एक शब्द टाइप करें।`;
            }

            await this.bot.sendMessage(chatId, helpMessage);
        }
    }

    async handleFeedback(chatId, data, userId) {
        const helpful = data === 'feedback_yes';

        try {
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

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

            let thankYouMessage;
            if (language === 'english') {
                thankYouMessage = helpful ?
                    'Thank you! Your feedback is valuable to us. 🙏' :
                    'Thank you! We will try to improve. 🙏';
            } else {
                thankYouMessage = helpful ?
                    'धन्यवाद! आपकी प्रतिक्रिया हमारे लिए महत्वपूर्ण है। 🙏' :
                    'धन्यवाद! हम बेहतर बनने की कोशिश करेंगे। 🙏';
            }

            await this.bot.sendMessage(chatId, thankYouMessage);
        } catch (error) {
            console.error('Error saving feedback:', error);
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

            const errorMessage = language === 'english' ?
                'Sorry, there was an error. Please try again later.' :
                'क्षमा करें, कुछ त्रुटि हुई है। कृपया बाद में पुनः प्रयास करें।';

            await this.bot.sendMessage(chatId, errorMessage);
        }
    }

    async handleHealthCheck(chatId, data, userId) {
        try {
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

            if (data === 'health_good') {
                let message;
                if (language === 'english') {
                    message = `✅ Great! You are healthy.

Remember:
• Regular doctor check-ups
• Nutritious diet
• Good sleep
• Light exercise

If you have any problems, always consult your doctor! 🩺`;
                } else {
                    message = `✅ बहुत अच्छा! आप स्वस्थ हैं।

याद रखें:
• नियमित डॉक्टर की जांच कराएं
• भरपूर आहार लें
• अच्छी नींद लें
• हल्का व्यायाम करें

कोई भी परेशानी हो तो हमेशा डॉक्टर से मिलें! 🩺`;
                }

                await this.bot.sendMessage(chatId, message);
            } else if (data === 'health_issues') {
                this.userStates.set(chatId, 'awaiting_health_details');

                let message;
                if (language === 'english') {
                    message = `🤕 What problems are you having? Please describe in detail:

Such as:
• Headache
• Vomiting
• Stomach pain
• Weakness
• Fever
• Any other problem

I will try to help you, but remember - if there are any serious symptoms, immediately consult a doctor! 🚨`;
                } else {
                    message = `🤕 क्या परेशानी हो रही है? कृपया विस्तार से बताएं:

जैसे:
• सिर दर्द
• उल्टी
• पेट दर्द
• कमजोरी
• बुखार
• कोई और समस्या

मैं आपकी मदद करने की कोशिश करूंगी, लेकिन याद रखें - यदि कोई गंभीर लक्षण है तो तुरंत डॉक्टर से मिलें! 🚨`;
                }

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
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

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
            let response;
            const lowText = text.toLowerCase();

            if (language === 'english') {
                response = `🩺 Your concern: "${text}"\n\n`;

                if (lowText.includes('sir') || lowText.includes('headache') || lowText.includes('dard')) {
                    response += `💊 For headache:\n• Drink plenty of water\n• Take rest\n• Apply cold compress\n• Reduce stress\n\n`;
                }

                if (lowText.includes('ulti') || lowText.includes('vomit') || lowText.includes('nausea')) {
                    response += `🤢 For vomiting:\n• Eat small amounts\n• Drink ginger tea\n• Have lemon water\n• Eat dry biscuits\n\n`;
                }

                if (lowText.includes('kabz') || lowText.includes('constipation')) {
                    response += `🚽 For constipation:\n• Eat fiber-rich food\n• Drink more water\n• Light exercise\n• Eat papaya, banana\n\n`;
                }

                if (lowText.includes('kamjor') || lowText.includes('weak') || lowText.includes('thak')) {
                    response += `😴 For weakness:\n• Get good sleep\n• Eat iron-rich food\n• Take vitamin supplements\n• Rest more\n\n`;
                }

                response += `⚠️ <b>Important:</b> If symptoms worsen or you have high fever, bleeding, severe pain, contact doctor IMMEDIATELY!\n\n📱 Emergency: 102 (Ambulance)`;
            } else {
                response = `🩺 आपकी परेशानी: "${text}"\n\n`;

                if (lowText.includes('sir') || lowText.includes('headache') || lowText.includes('dard')) {
                    response += `💊 सिर दर्द के लिए:\n• भरपूर पानी पिएं\n• आराम करें\n• ठंडा सेकाई लगाएं\n• तनाव कम रखें\n\n`;
                }

                if (lowText.includes('ulti') || lowText.includes('vomit') || lowText.includes('nausea')) {
                    response += `🤢 उल्टी के लिए:\n• थोड़ा-थोड़ा खाएं\n• अदरक की चाय पिएं\n• नींबू पानी लें\n• सूखे बिस्कुट खाएं\n\n`;
                }

                if (lowText.includes('kabz') || lowText.includes('constipation')) {
                    response += `🚽 कब्ज के लिए:\n• फाइबर वाला खाना लें\n• ज्यादा पानी पिएं\n• हल्का व्यायाम करें\n• पपीता, केला खाएं\n\n`;
                }

                if (lowText.includes('kamjor') || lowText.includes('weak') || lowText.includes('thak')) {
                    response += `😴 कमजोरी के लिए:\n• अच्छी नींद लें\n• आयरन युक्त भोजन खाएं\n• विटामिन सप्लीमेंट लें\n• ज्यादा आराम करें\n\n`;
                }

                response += `⚠️ <b>महत्वपूर्ण:</b> यदि लक्षण बढ़ते रहें या तेज बुखार, खून आना, गंभीर दर्द हो तो तुरंत डॉक्टर से मिलें!\n\n📱 आपातकाल: 102 (एम्बुलेंस)`;
            }

            let options;
            if (language === 'english') {
                options = {
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: 'Helpful ✅', callback_data: 'feedback_yes' },
                                { text: 'Need doctor 🏥', callback_data: 'need_doctor' }
                            ]
                        ]
                    }
                };
            } else {
                options = {
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
            }

            await this.bot.sendMessage(chatId, response, options);

        } catch (error) {
            console.error('Error handling health details:', error);
            const user = await User.findOne({ telegramId: chatId.toString() });
            const language = user?.language || 'hindi';

            const errorMessage = language === 'english' ?
                'Sorry, there was an error. Please try again later.' :
                'क्षमा करें, कुछ त्रुटि हुई है। कृपया बाद में पुनः प्रयास करें।';

            await this.bot.sendMessage(chatId, errorMessage);
        }
    }
}

module.exports = BotService;