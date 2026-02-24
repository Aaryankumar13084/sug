const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const PregnancyService = require('./pregnancyService');
const KeywordService = require('./keywordService');
const GeminiService = require('./geminiService');
const SuggestionService = require('./suggestionService');
const { calculatePregnancyWeek, isValidDate, parseDate, isValidConceptionDate, calculateDaysSinceConception, getTrimester, getTrimesterText, formatDateForDisplay } = require('../utils/dateUtils');
const { getAyurvedicRemedies } = require('../data/ayurvedicRemedies');
const { getAyurvedicRemediesEnglish } = require('../data/ayurvedicRemedies-english');
const { getNutritionChart } = require('../data/nutritionChart');
const { getNutritionChartEnglish } = require('../data/nutritionChart-english');

class BotService {
    constructor(bot) {
        this.bot = bot;
        this.pregnancyService = new PregnancyService();
        this.keywordService = new KeywordService();
        this.geminiService = new GeminiService();
        this.suggestionService = new SuggestionService();
        this.userStates = new Map(); // Track user conversation states
        this.webSessions = new Map(); // Track web chat conversation history
    }

    async handleWebMessage(message, language, sessionId, chatSessionId) {
        console.log(`\n[handleWebMessage] START - msg:"${message.substring(0, 30)}", lang:${language}, sessionId:${sessionId}`);
        try {
            // Map short language codes to full names used by services
            const langFull = language === 'en' ? 'english' : 'hindi';
            console.log(`[handleWebMessage] langFull: ${langFull}`);

            // Check if user is in registration flow
            const userState = this.userStates.get(sessionId);
            if (userState) {
                if (userState.state === 'awaiting_consent') {
                    if (message.toLowerCase().includes('yes') || message.includes('हाँ') || message.includes('agree')) {
                        const response = await this.requestWebDueDate(sessionId, langFull);
                        return { response, suggestions: [] };
                    } else {
                        const response = langFull === 'english' ? 'Registration cancelled. Type "start" to try again.' : 'पंजीकरण रद्द कर दिया गया। फिर से शुरू करने के लिए "शुरू" लिखें।';
                        return { response, suggestions: [] };
                    }
                }
                if (userState.state === 'awaiting_due_date') {
                    const response = await this.handleWebDueDateInput(sessionId, message, langFull);
                    return { response, suggestions: [] };
                }
            }

            // Check if user is already registered in this session
            let existingUser = null;
            try {
                existingUser = await User.findOne({ sessionId: sessionId, consentGiven: true });
            } catch (e) {
                console.error('Error checking user session:', e);
            }

            // If not registered, show registration form directly (no keywords needed)
            if (!existingUser) {
            const formHtml = `
<div class="reg-form-container">
    <h4>${langFull === 'english' ? 'Complete Registration' : 'पंजीकरण पूर्ण करें'}</h4>
    <form onsubmit="submitRegistrationForm(event)">
        <div class="reg-form-group">
            <label for="reg-firstName">
                ${langFull === 'english' ? 'First Name' : 'पहला नाम'}
                <span style="color: var(--primary-pink);">*</span>
            </label>
            <input
                type="text"
                id="reg-firstName"
                name="firstName"
                required
                aria-required="true"
                placeholder="${langFull === 'english' ? 'Your name' : 'आपका नाम'}"
            >
        </div>
        <div class="reg-form-group">
            <label for="reg-conceptionDate">
                ${langFull === 'english' ? 'Conception Date' : 'गर्भधारण की तिथि'}
                <span style="color: var(--primary-pink);">*</span>
            </label>
            <input
                type="text"
                id="reg-conceptionDate"
                name="conceptionDate"
                required
                aria-required="true"
                placeholder="DD/MM/YYYY"
                pattern="\\d{2}/\\d{2}/\\d{4}"
            >
            <small style="font-size: 0.8rem; color: var(--text-light); margin-top: 3px; display: block;">
                ${langFull === 'english' ? 'Format: DD/MM/YYYY' : 'प्रारूप: DD/MM/YYYY'}
            </small>
        </div>
        <div class="reg-form-group">
            <label for="reg-age">
                ${langFull === 'english' ? 'Age' : 'उम्र'}
                <span style="color: var(--text-light);">(${langFull === 'english' ? 'Optional' : 'वैकल्पिक'})</span>
            </label>
            <input
                type="number"
                id="reg-age"
                name="age"
                min="15"
                max="60"
                placeholder="${langFull === 'english' ? 'Your age' : 'आपकी उम्र'}"
            >
        </div>
        <div class="reg-form-group">
            <label for="reg-location">
                ${langFull === 'english' ? 'Location' : 'स्थान'}
                <span style="color: var(--text-light);">(${langFull === 'english' ? 'Optional' : 'वैकल्पिक'})</span>
            </label>
            <input
                type="text"
                id="reg-location"
                name="location"
                placeholder="${langFull === 'english' ? 'City/Area' : 'शहर/क्षेत्र'}"
            >
        </div>
        <button type="submit" class="reg-submit-btn">
            <span class="btn-text">${langFull === 'english' ? 'Complete Registration' : 'पंजीकरण पूर्ण करें'}</span>
        </button>
    </form>
</div>
`;
                return { response: formHtml, suggestions: [] };
            }

            // For web chat, SKIP keyword matching - always use AI for better responses
            console.log(`[handleWebMessage] ℹ️  Skipping keyword service - using AI for web chat`);

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

            // Get registered user to add pregnancy context (same as Telegram)
            let user = null;
            try {
                user = await User.findOne({ sessionId: sessionId, consentGiven: true });
            } catch (e) {
                console.error('Error fetching user for web chat:', e);
            }

            // Build pregnancy context (same as Telegram bot)
            let fullMessage = message;
            if (user && user.dueDate) {
                const currentWeek = calculatePregnancyWeek(user.dueDate);
                const daysSinceConception = calculateDaysSinceConception(user.dueDate);
                const trimester = getTrimester(currentWeek);
                const trimesterText = getTrimesterText(currentWeek, langFull);
                const conceptionDateFormatted = formatDateForDisplay(new Date(user.dueDate), langFull);
                const todayFormatted = formatDateForDisplay(new Date(), langFull);

                const pregnancyContext = langFull === 'english'
                    ? `\n\nComprehensive Pregnancy Information:
- Conception Date: ${conceptionDateFormatted}
- Current Date: ${todayFormatted}
- Days Since Conception: ${daysSinceConception} days
- Current Week: Week ${currentWeek} of 42
- Trimester: ${trimesterText}

Please reference the user's current pregnancy stage in your response when relevant.`
                    : `\n\nव्यापक गर्भावस्था जानकारी:
- गर्भधारण की तिथि: ${conceptionDateFormatted}
- आज की तिथि: ${todayFormatted}
- गर्भधारण से दिन: ${daysSinceConception} दिन
- वर्तमान सप्ताह: 42 में से ${currentWeek}वां सप्ताह
- तिमाही: ${trimesterText}

कृपया जब प्रासंगिक हो तो अपने उत्तर में उपयोगकर्ता की वर्तमान गर्भावस्था अवस्था का संदर्भ दें।`;

                // Add response style context
                const responseStyleContext = langFull === 'english'
                    ? '\n\nIMPORTANT: Prioritize home remedies and natural solutions. Do NOT suggest medicines unless I specifically ask for medicine. Keep your answer SHORT (3-5 bullet points). Only give detailed answer if I ask for more detail.'
                    : '\n\nमहत्वपूर्ण: पहले देसी नुस्खे और घरेलू उपाय बताएं। दवाई तभी बताएं जब मैं खुद पूछूं। छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब मैं कहूं।';

                fullMessage = message + pregnancyContext + responseStyleContext;
            }

            // Generate AI response with conversation history and pregnancy context
            const aiResponse = await this.geminiService.generateResponse(fullMessage, langFull, history);

            // Generate smart suggestions based on session history
            console.log(`\n[Web Chat] 🔍 GENERATING SUGGESTIONS`);
            console.log(`[Web Chat] Message: "${message.substring(0, 50)}..."`);
            console.log(`[Web Chat] Language: ${langFull}`);
            console.log(`[Web Chat] History entries: ${history.length}`);

            if (history.length > 0) {
                console.log(`[Web Chat] History content:`, history.map(h => ({
                    q: h.question?.substring(0, 30),
                    a: h.answer?.substring(0, 30)
                })));
            }

            const suggestions = await this.suggestionService.getSuggestions(
                history,
                message,
                langFull
            );
            console.log(`[Web Chat] ✅ Got ${suggestions.length} suggestions`);
            suggestions.forEach((sug, idx) => {
                console.log(`[Web Chat]   ${idx + 1}. ${sug.substring(0, 60)}...`);
            });

            // Save to DB session history
            if (chatSessionId && sessionDoc) {
                try {
                    // Save user message
                    sessionDoc.messages.push({ role: 'user', text: message });
                    // Save model response
                    sessionDoc.messages.push({ role: 'model', text: aiResponse }); // Save original response
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

            // Return response with suggestions as separate object
            const result = {
                response: aiResponse,
                suggestions: suggestions && suggestions.length > 0 ? suggestions : []
            };
            console.log(`[handleWebMessage] ✅ RETURNING - suggestions: ${result.suggestions.length}`);
            return result;
        } catch (error) {
            console.error('❌ [handleWebMessage] Error:', error);
            console.error('Error stack:', error.stack);
            const errorResponse = language === 'hi' ? 'क्षमा करें, मैं अभी जवाब नहीं दे सकता।' : 'Sorry, I cannot respond right now.';
            console.log(`[handleWebMessage] ❌ RETURNING error response`);
            return { response: errorResponse, suggestions: [] };
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

            // Get conversation history for context
            const conversationHistory = user && user.conversationHistory ? user.conversationHistory : [];

            // Generate response using Gemini API with conversation history
            const response = await this.geminiService.generateResponse(userQuestion + responseStyleNote, language, conversationHistory);

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

            // If user is already registered, always handle as AI response (even if they send /start again)
            if (user && user.consentGiven) {
                await this.handleAutomaticAIResponse(chatId, text, user);
            } else if (!user) {
                // For completely unregistered users, show registration flow directly
                await this.handleStart(msg);
            }
            // If user exists but consent is not given, they are in registration flow - let other handlers deal with it

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

        try {
            await this.bot.sendMessage(chatId, message);

            // Helper function to delay execution
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Send Ayurvedic remedies (with 2-second delay)
            await delay(2000);
            try {
                const user = await User.findOne({ telegramId: chatId.toString() });
                if (user) {
                    const currentWeek = calculatePregnancyWeek(user.dueDate);
                    const userLanguage = user.language || 'hindi';

                    // Generate Ayurvedic remedies using AI
                    const ayurvedicPrompt = userLanguage === 'english'
                        ? `You are a pregnancy health expert. Provide Ayurvedic remedies and guidance specifically for week ${currentWeek} of pregnancy. Format concisely:\n🌿 <b>Ayurvedic Remedies for Week ${currentWeek}</b>\n\n<b>General Guidance:</b>\n[2-3 bullet points]\n\n<b>Remedies & Practices:</b>\n[2-3 bullet points]\n\n<b>Beneficial Herbs:</b>\n[2-3 bullet points]\n\n<b>⚠️ Things to Avoid:</b>\n[2-3 bullet points]\n\n<b>📋 Disclaimer:</b> Consult your doctor before trying any remedies.`
                        : `आप गर्भावस्था स्वास्थ्य विशेषज्ञ हैं। सप्ताह ${currentWeek} के लिए आयुर्वेदिक उपचार प्रदान करें। संक्षिप्त रखें:\n🌿 <b>सप्ताह ${currentWeek} के आयुर्वेदिक उपाय</b>\n\n<b>सामान्य मार्गदर्शन:</b>\n[2-3 बुलेट]\n\n<b>उपचार:</b>\n[2-3 बुलेट]\n\n<b>जड़ी-बूटियां:</b>\n[2-3 बुलेट]\n\n<b>⚠️ बचें:</b>\n[2-3 बुलेट]\n\n<b>📋 अस्वीकरण:</b> डॉक्टर से सलाह लें।`;

                    const ayurvedicMessage = await this.geminiService.generateResponse(ayurvedicPrompt, userLanguage, []);

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
                    await this.bot.sendMessage(chatId, ayurvedicMessage, options);
                    console.log(`Sent AI-generated Ayurvedic remedies to user ${chatId} (week ${currentWeek})`);
                }
            } catch (error) {
                console.error('Error sending Ayurvedic remedies:', error);
            }

            // Send nutrition chart (with 4-second total delay)
            await delay(2000);
            try {
                const user = await User.findOne({ telegramId: chatId.toString() });
                if (user) {
                    const currentWeek = calculatePregnancyWeek(user.dueDate);
                    const userLanguage = user.language || 'hindi';

                    // Generate Nutrition chart using AI
                    const nutritionPrompt = userLanguage === 'english'
                        ? `You are a pregnancy nutrition expert. Provide a nutrition guide for week ${currentWeek} of pregnancy. IMPORTANT: Include both vegetarian and non-vegetarian options. Format concisely:\n🥗 <b>Nutrition Chart for Week ${currentWeek}</b>\n\n<b>Daily Calorie Needs:</b>\n[brief info]\n\n<b>Protein Sources (Veg & Non-Veg):</b>\n• Non-veg: egg, fish, chicken\n• Vegetarian: dal, paneer, beans\n\n<b>Vegetables:</b>\n[2-3 bullet points]\n\n<b>Fruits:</b>\n[2-3 bullet points]\n\n<b>Healthy Grains:</b>\n[2-3 bullet points]\n\n<b>Supplements:</b>\n[2-3 bullet points]\n\n<b>Hydration:</b>\n[brief info]\n\n<b>Sample Meal Plan (Choose Veg/Non-Veg):</b>\n🍳 <b>Breakfast:</b> [both options]\n🍲 <b>Lunch:</b> [both options]\n🥘 <b>Dinner:</b> [both options]\n\n<b>📋 Disclaimer:</b> General guidance only. Follow your doctor's advice.`
                        : `आप गर्भावस्था पोषण विशेषज्ञ हैं। सप्ताह ${currentWeek} के लिए पोषण गाइड दें। महत्वपूर्ण: शाकाहारी और मांसाहारी दोनों विकल्प शामिल करें। संक्षिप्त रखें:\n🥗 <b>सप्ताह ${currentWeek} पोषण चार्ट</b>\n\n<b>दैनिक कैलोरी:</b>\n[संक्षिप्त]\n\n<b>प्रोटीन (शाकाहारी व मांसाहारी):</b>\n• मांसाहारी: अंडा, मछली, चिकन\n• शाकाहारी: दाल, पनीर, बीन्स\n\n<b>सब्जियां:</b>\n[2-3 बुलेट]\n\n<b>फल:</b>\n[2-3 बुलेट]\n\n<b>अनाज:</b>\n[2-3 बुलेट]\n\n<b>पूरक:</b>\n[2-3 बुलेट]\n\n<b>तरल:</b>\n[संक्षिप्त]\n\n<b>नमूना भोजन (शाकाहारी/मांसाहारी चुनें):</b>\n🍳 <b>नाश्ता:</b> [दोनों विकल्प]\n🍲 <b>दोपहर:</b> [दोनों विकल्प]\n🥘 <b>रात:</b> [दोनों विकल्प]\n\n<b>📋 अस्वीकरण:</b> सामान्य मार्गदर्शन। डॉक्टर की सलाह लें।`;

                    const nutritionMessage = await this.geminiService.generateResponse(nutritionPrompt, userLanguage, []);

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
                    await this.bot.sendMessage(chatId, nutritionMessage, options);
                    console.log(`Sent AI-generated nutrition chart to user ${chatId} (week ${currentWeek})`);
                }
            } catch (error) {
                console.error('Error sending nutrition chart:', error);
            }

            // Send current week info (with 2-second more delay)
            await delay(2000);
            try {
                await this.pregnancyService.sendCurrentWeekInfo(this.bot, chatId);
                console.log(`Sent current week info to user ${chatId}`);
            } catch (error) {
                console.error('Error sending current week info:', error);
            }
        } catch (error) {
            console.error('Error in completeRegistration:', error);
        }
    }

    formatAyurvedicMessage(week, content, language = 'hindi') {
        if (language === 'english') {
            return `🌿 <b>Ayurvedic Remedies for Week ${week}</b>

<b>General Guidance:</b>
${content.generalGuidance.map(item => `• ${item}`).join('\n')}

<b>Remedies & Practices:</b>
${content.remedies.map(item => `• ${item}`).join('\n')}

<b>Beneficial Herbs:</b>
${content.herbs.map(item => `• ${item}`).join('\n')}

<b>⚠️ Things to Avoid:</b>
${content.avoid.map(item => `• ${item}`).join('\n')}

<b>📋 Important Disclaimer:</b> Please consult your doctor before starting any new remedies or herbs. This information is for educational purposes only.

Was this information helpful?`;
        } else {
            return `🌿 <b>सप्ताह ${week} के लिए आयुर्वेदिक उपाय</b>

<b>सामान्य मार्गदर्शन:</b>
${content.generalGuidance.map(item => `• ${item}`).join('\n')}

<b>उपचार और प्रथाएं:</b>
${content.remedies.map(item => `• ${item}`).join('\n')}

<b>लाभकारी जड़ी-बूटियां:</b>
${content.herbs.map(item => `• ${item}`).join('\n')}

<b>⚠️ बचने योग्य चीजें:</b>
${content.avoid.map(item => `• ${item}`).join('\n')}

<b>📋 महत्वपूर्ण अस्वीकरण:</b> कोई भी नया उपचार या जड़ी-बूटी शुरू करने से पहले कृपया अपने डॉक्टर से सलाह लें। यह जानकारी केवल शैक्षणिक उद्देश्यों के लिए है।

क्या यह जानकारी उपयोगी थी?`;
        }
    }

    formatNutritionMessage(week, content, language = 'hindi') {
        if (language === 'english') {
            return `🥗 <b>Nutrition Chart for Week ${week}</b>

<b>Daily Calorie Needs:</b>
${content.calorieNeeds}

<b>Protein Sources:</b>
${content.proteinSources.map(item => `• ${item}`).join('\n')}

<b>Vegetables to Include:</b>
${content.vegetables.map(item => `• ${item}`).join('\n')}

<b>Fruits to Include:</b>
${content.fruits.map(item => `• ${item}`).join('\n')}

<b>Healthy Grains:</b>
${content.grains.map(item => `• ${item}`).join('\n')}

<b>Important Supplements:</b>
${content.supplements.map(item => `• ${item}`).join('\n')}

<b>Hydration:</b>
${content.hydration}

<b>Sample Meal Plan:</b>
🍳 <b>Breakfast:</b> ${content.mealPlan.breakfast}
🍲 <b>Lunch:</b> ${content.mealPlan.lunch}
🥘 <b>Dinner:</b> ${content.mealPlan.dinner}
🥤 <b>Snacks:</b> ${content.mealPlan.snacks}

<b>📋 Disclaimer:</b> This is general guidance. Please follow your doctor's specific recommendations. Every pregnancy is unique.

Was this information helpful?`;
        } else {
            return `🥗 <b>सप्ताह ${week} के लिए पोषण चार्ट</b>

<b>दैनिक कैलोरी आवश्यकता:</b>
${content.calorieNeeds}

<b>प्रोटीन के स्रोत:</b>
${content.proteinSources.map(item => `• ${item}`).join('\n')}

<b>शामिल करने योग्य सब्जियां:</b>
${content.vegetables.map(item => `• ${item}`).join('\n')}

<b>शामिल करने योग्य फल:</b>
${content.fruits.map(item => `• ${item}`).join('\n')}

<b>स्वस्थ अनाज:</b>
${content.grains.map(item => `• ${item}`).join('\n')}

<b>महत्वपूर्ण पूरक:</b>
${content.supplements.map(item => `• ${item}`).join('\n')}

<b>हाइड्रेशन:</b>
${content.hydration}

<b>नमूना भोजन योजना:</b>
🍳 <b>नाश्ता:</b> ${content.mealPlan.breakfast}
🍲 <b>दोपहर का भोजन:</b> ${content.mealPlan.lunch}
🥘 <b>रात का भोजन:</b> ${content.mealPlan.dinner}
🥤 <b>स्नैक्स:</b> ${content.mealPlan.snacks}

<b>📋 अस्वीकरण:</b> यह सामान्य मार्गदर्शन है। कृपया अपने डॉक्टर की विशिष्ट सिफारिशों का पालन करें। हर गर्भावस्था अद्वितीय है।

क्या यह जानकारी उपयोगी थी?`;
        }
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

            // Add comprehensive user's pregnancy context
            const currentWeek = calculatePregnancyWeek(user.dueDate);
            const daysSinceConception = calculateDaysSinceConception(user.dueDate);
            const trimester = getTrimester(currentWeek);
            const trimesterText = getTrimesterText(currentWeek, user.language);
            const conceptionDateFormatted = formatDateForDisplay(new Date(user.dueDate), user.language);
            const todayFormatted = formatDateForDisplay(new Date(), user.language);

            const pregnancyContext = user.language === 'english'
                ? `\n\nComprehensive Pregnancy Information:
- Conception Date: ${conceptionDateFormatted}
- Current Date: ${todayFormatted}
- Days Since Conception: ${daysSinceConception} days
- Current Week: Week ${currentWeek} of 42
- Trimester: ${trimesterText}

Please reference the user's current pregnancy stage in your response when relevant.`
                : `\n\nव्यापक गर्भावस्था जानकारी:
- गर्भधारण की तिथि: ${conceptionDateFormatted}
- आज की तिथि: ${todayFormatted}
- गर्भधारण से दिन: ${daysSinceConception} दिन
- वर्तमान सप्ताह: 42 में से ${currentWeek}वां सप्ताह
- तिमाही: ${trimesterText}

कृपया जब प्रासंगिक हो तो अपने उत्तर में उपयोगकर्ता की वर्तमान गर्भावस्था अवस्था का संदर्भ दें।`;

            // Add desi nuskhe and short-answer instructions
            const responseStyleContext = user.language === 'english'
                ? '\n\nIMPORTANT: Prioritize home remedies and natural solutions. Do NOT suggest medicines unless I specifically ask for medicine. Keep your answer SHORT (3-5 bullet points). Only give detailed answer if I ask for more detail.'
                : '\n\nमहत्वपूर्ण: पहले देसी नुस्खे और घरेलू उपाय बताएं। दवाई तभी बताएं जब मैं खुद पूछूं। छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब मैं कहूं।';

            // Create the full prompt with context
            const fullQuestion = text + contextPrompt + pregnancyContext + responseStyleContext;

            // Generate response using Gemini API with conversation history for better context
            const response = await this.geminiService.generateResponse(fullQuestion, user.language, user.conversationHistory);

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

            // Generate smart suggestions based on session history
            console.log(`\n[Telegram] 🔍 GENERATING SUGGESTIONS`);
            console.log(`[Telegram] User: ${user.firstName}, Language: ${user.language}`);
            console.log(`[Telegram] Message: "${text.substring(0, 50)}..."`);
            console.log(`[Telegram] History entries: ${user.conversationHistory.length}`);

            const suggestions = await this.suggestionService.getSuggestions(
                user.conversationHistory,
                text,
                user.language
            );

            console.log(`[Telegram] ✅ Got ${suggestions.length} suggestions`);
            suggestions.forEach((sug, idx) => {
                console.log(`[Telegram]   ${idx + 1}. ${sug.substring(0, 60)}...`);
            });

            // Send the AI-generated response with feedback buttons
            const formattedResponse = user.language === 'english'
                ? `🤖 AI Assistant:\n\n${response}`
                : `🤖 AI सहायक:\n\n${response}`;

            // Build keyboard with feedback buttons + suggestions
            const keyboardRows = [];

            // Add feedback buttons
            keyboardRows.push(
                user.language === 'english'
                    ? [
                        { text: 'Yes, helpful ✅', callback_data: 'feedback_yes' },
                        { text: 'No, not helpful ❌', callback_data: 'feedback_no' }
                    ]
                    : [
                        { text: 'हाँ, उपयोगी था ✅', callback_data: 'feedback_yes' },
                        { text: 'नहीं, उपयोगी नहीं था ❌', callback_data: 'feedback_no' }
                    ]
            );

            // Add suggestion buttons if available
            if (suggestions && suggestions.length > 0) {
                console.log(`[Telegram] 📌 Adding ${suggestions.length} suggestion buttons`);
                suggestions.forEach(suggestion => {
                    keyboardRows.push([
                        {
                            text: suggestion.substring(0, 50) + (suggestion.length > 50 ? '...' : ''),
                            callback_data: `suggestion_${Buffer.from(suggestion).toString('base64').substring(0, 50)}`
                        }
                    ]);
                });
            } else {
                console.log(`[Telegram] ⚠️  No suggestions to add`);
            }

            const options = {
                reply_markup: {
                    inline_keyboard: keyboardRows
                },
                parse_mode: 'HTML'
            };

            await this.bot.sendMessage(chatId, formattedResponse, options);

        } catch (error) {
            console.error('❌ Error in handleAutomaticAIResponse:', error);
            console.error('Error stack:', error.stack);

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