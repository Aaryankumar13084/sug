const path = require('path');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const connectDB = require('./config/database');
const BotService = require('./services/botService');
const PregnancyService = require('./services/pregnancyService');
const User = require('./models/User');
const ChatSession = require('./models/ChatSession');
const { parseDate, isValidDate, isValidConceptionDate, calculatePregnancyWeek } = require('./utils/dateUtils');
const GeminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS or simple HTML
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Get bot token from environment
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is required in environment variables');
    process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const botService = new BotService(bot);
const pregnancyService = new PregnancyService();
const geminiService = new GeminiService();

// Connect to MongoDB
connectDB();

// Initialize bot handlers
botService.initializeHandlers();

// Schedule weekly updates - runs every day at 9 AM IST
cron.schedule('0 9 * * *', async () => {
    console.log('Running daily check for weekly updates...');
    try {
        await pregnancyService.sendWeeklyUpdates(bot);
    } catch (error) {
        console.error('Error in scheduled weekly updates:', error);
    }
}, {
    timezone: "Asia/Kolkata"
});

// Schedule weekly health check - runs every Monday at 10 AM IST
cron.schedule('0 10 * * 1', async () => {
    console.log('Sending weekly health check to all users...');
    try {
        await pregnancyService.sendWeeklyHealthCheckToAll(bot);
    } catch (error) {
        console.error('Error in scheduled weekly health check:', error);
    }
}, {
    timezone: "Asia/Kolkata"
});

// Root endpoint - Landing Page
app.get('/', (req, res) => {
    res.render('index', {
        name: 'Sugam Garbh',
        description: 'A pregnancy tracking platform that provides weekly updates, health checks, and support in Hindi and English',
        features: [
            'Weekly pregnancy updates',
            'Health check reminders',
            'Keyword-based responses',
            'Bilingual support (Hindi/English)',
            'Automated scheduling'
        ]
    });
});

// Chat interface endpoint
app.get('/chat', (req, res) => {
    res.render('chat');
});

// Web Chat API endpoint
app.post('/api/chat', async (req, res) => {
    const { message, language, sessionId, chatSessionId } = req.body;
    try {
        console.log(`Processing web chat: session=${sessionId}, chatSession=${chatSessionId}`);
        const response = await botService.handleWebMessage(message, language || 'hi', sessionId, chatSessionId);

        // Save to chat session if provided
        if (chatSessionId) {
            const ChatSession = require('./models/ChatSession');
            const session = await ChatSession.findById(chatSessionId);
            if (session) {
                session.messages.push({ role: 'user', text: message });
                session.messages.push({ role: 'model', text: response });
                await session.save();
                console.log('Messages saved to session');
            }
        }

        res.json({ response });
    } catch (error) {
        console.error('Web Chat Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Get all chat sessions for a web user
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        console.log(`Fetching sessions for sessionId: ${req.params.sessionId}`);
        const sessions = await ChatSession.find({ userSessionId: req.params.sessionId })
            .select('title createdAt updatedAt')
            .sort({ updatedAt: -1 });
        console.log(`Found ${sessions.length} sessions`);
        res.json({ sessions });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Create a new chat session
app.post('/api/sessions', async (req, res) => {
    try {
        const { sessionId, title } = req.body;
        console.log(`Creating new session for sessionId: ${sessionId}, title: ${title}`);
        const newSession = new ChatSession({
            userSessionId: sessionId,
            title: title || 'New Chat'
        });
        await newSession.save();
        console.log(`Created session with ID: ${newSession._id}`);
        res.status(201).json({ session: newSession });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Get a specific chat session's messages
app.get('/api/sessions/:sessionId/:chatSessionId', async (req, res) => {
    try {
        console.log(`Fetching messages for chatSessionId: ${req.params.chatSessionId}, userSessionId: ${req.params.sessionId}`);
        const session = await ChatSession.findOne({
            _id: req.params.chatSessionId,
            userSessionId: req.params.sessionId
        });
        if (!session) {
            console.log('Session not found');
            return res.status(404).json({ error: 'Session not found' });
        }

        // Decrypt messages before sending to client
        const decryptedMessages = session.messages.map(msg => {
            const { decrypt } = require('./utils/encryption');
            return {
                ...msg.toObject(),
                text: decrypt(msg.text)
            };
        });

        console.log(`Found session with ${decryptedMessages.length} messages`);
        res.json({
            session: {
                ...session.toObject(),
                messages: decryptedMessages
            }
        });
    } catch (error) {
        console.error('Error fetching session details:', error);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});

// Delete a specific chat session
app.delete('/api/sessions/:sessionId/:chatSessionId', async (req, res) => {
    try {
        await ChatSession.findOneAndDelete({
            _id: req.params.chatSessionId,
            userSessionId: req.params.sessionId
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
});

// Push Subscription endpoint
app.post('/api/subscribe', async (req, res) => {
    const { subscription, sessionId } = req.body;
    try {
        // Find user by session if they just registered
        const user = await User.findOne({ sessionId: sessionId }).sort({ createdAt: -1 });
        if (user) {
            user.webPushSubscription = subscription;
            await user.save();
            res.status(201).json({});
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Subscription Error:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// Registration API endpoint
app.post('/api/register', async (req, res) => {
    const { firstName, conceptionDate, sessionId, age, location, parity, healthConditions, language } = req.body;
    try {
        const dueDate = parseDate(conceptionDate);
        if (!dueDate || !isValidDate(dueDate) || !isValidConceptionDate(dueDate)) {
            return res.status(400).json({ error: 'Invalid date. Please use DD/MM/YYYY format and ensure it is within the last 10 months.' });
        }

        // Use sessionId to find and update or create new user
        const user = await User.findOneAndUpdate(
            { sessionId: sessionId },
            {
                firstName: firstName,
                dueDate: dueDate,
                age: age,
                location: location,
                parity: parity,
                healthConditions: healthConditions || [],
                language: language || 'hindi',
                registrationSource: 'web',
                isActive: true,
                consentGiven: true
            },
            { upsert: true, new: true, runValidators: true }
        );

        const currentWeek = calculatePregnancyWeek(user.dueDate);
        const userLanguage = user.language || 'hindi';

        // Build welcome message
        let welcomeMsg;
        if (userLanguage === 'english') {
            welcomeMsg = `🎉 Registration complete!\n\nYou will now receive weekly pregnancy information.\n\nYou can ask me about any of these topics anytime:\n• Constipation\n• Vaccination\n• Diet\n• Anxiety\n• Exercise\n• Headache\n• Vomiting\n\nStay healthy! 🤱`;
        } else {
            welcomeMsg = `🎉 पंजीकरण पूरा हुआ!\n\nअब आपको हर सप्ताह गर्भावस्था की जानकारी मिलेगी।\n\nआप कभी भी निम्न सवाल पूछ सकती हैं:\n• कब्ज\n• टीकाकरण\n• आहार\n• चिंता\n• व्यायाम\n• सिरदर्द\n• उल्टी\n\nस्वस्थ रहें! 🤱`;
        }

        // Generate Ayurvedic remedies using AI
        const ayurvedicPrompt = userLanguage === 'english'
            ? `You are a pregnancy health expert. Provide Ayurvedic remedies and guidance specifically for week ${currentWeek} of pregnancy. Format as:
🌿 <b>Ayurvedic Remedies for Week ${currentWeek}</b>

<b>General Guidance:</b>
[bullet points]

<b>Remedies & Practices:</b>
[bullet points]

<b>Beneficial Herbs:</b>
[bullet points with doctor consultation note]

<b>⚠️ Things to Avoid:</b>
[bullet points]

<b>📋 Important Disclaimer:</b> Please consult your doctor before starting any new remedies or herbs. This information is for educational purposes only.

Keep it concise and practical for week ${currentWeek}.`
            : `आप एक गर्भावस्था स्वास्थ्य विशेषज्ञ हैं। गर्भावस्था के सप्ताह ${currentWeek} के लिए विशेष रूप से आयुर्वेदिक उपचार और मार्गदर्शन प्रदान करें। इस प्रारूप में:
🌿 <b>सप्ताह ${currentWeek} के लिए आयुर्वेदिक उपाय</b>

<b>सामान्य मार्गदर्शन:</b>
[बुलेट पॉइंट्स]

<b>उपचार और प्रथाएं:</b>
[बुलेट पॉइंट्स]

<b>लाभकारी जड़ी-बूटियां:</b>
[डॉक्टर परामर्श नोट के साथ बुलेट पॉइंट्स]

<b>⚠️ बचने योग्य चीजें:</b>
[बुलेट पॉइंट्स]

<b>📋 महत्वपूर्ण अस्वीकरण:</b> कोई भी नया उपचार या जड़ी-बूटी शुरू करने से पहले कृपया अपने डॉक्टर से सलाह लें। यह जानकारी केवल शैक्षणिक उद्देश्यों के लिए है।

सप्ताह ${currentWeek} के लिए संक्षिप्त और व्यावहारिक रखें।`;

        const ayurvedicMsg = await geminiService.generateResponse(ayurvedicPrompt, userLanguage, []);

        // Generate Nutrition chart using AI
        const nutritionPrompt = userLanguage === 'english'
            ? `You are a pregnancy nutrition expert. Provide a complete nutrition guide for week ${currentWeek} of pregnancy. IMPORTANT: Include both vegetarian and non-vegetarian options with alternatives. Format as:
🥗 <b>Nutrition Chart for Week ${currentWeek}</b>

<b>Daily Calorie Needs:</b>
[calorie requirement]

<b>Protein Sources (Vegetarian & Non-Vegetarian):</b>
• Non-veg: [options like egg, fish, chicken]
• Vegetarian: [options like dal, paneer, beans]

<b>Vegetables to Include:</b>
[bullet points]

<b>Fruits to Include:</b>
[bullet points]

<b>Healthy Grains:</b>
[bullet points]

<b>Important Supplements:</b>
[bullet points]

<b>Hydration:</b>
[hydration needs]

<b>Sample Meal Plan (Choose Vegetarian or Non-Vegetarian):</b>
🍳 <b>Breakfast:</b> [veg & non-veg options]
🍲 <b>Lunch:</b> [veg & non-veg options]
🥘 <b>Dinner:</b> [veg & non-veg options]
🥤 <b>Snacks:</b> [options]

<b>📋 Disclaimer:</b> This is general guidance. Please follow your doctor's specific recommendations. Every pregnancy is unique.

Make it practical with both diet options for week ${currentWeek}.`
            : `आप एक गर्भावस्था पोषण विशेषज्ञ हैं। गर्भावस्था के सप्ताह ${currentWeek} के लिए एक संपूर्ण पोषण गाइड प्रदान करें। महत्वपूर्ण: शाकाहारी और मांसाहारी दोनों विकल्प विकल्प दें। इस प्रारूप में:
🥗 <b>सप्ताह ${currentWeek} के लिए पोषण चार्ट</b>

<b>दैनिक कैलोरी आवश्यकता:</b>
[कैलोरी आवश्यकता]

<b>प्रोटीन के स्रोत (शाकाहारी और मांसाहारी):</b>
• मांसाहारी: [अंडा, मछली, चिकन जैसे विकल्प]
• शाकाहारी: [दाल, पनीर, बीन्स जैसे विकल्प]

<b>शामिल करने योग्य सब्जियां:</b>
[बुलेट पॉइंट्स]

<b>शामिल करने योग्य फल:</b>
[बुलेट पॉइंट्स]

<b>स्वस्थ अनाज:</b>
[बुलेट पॉइंट्स]

<b>महत्वपूर्ण पूरक:</b>
[बुलेट पॉइंट्स]

<b>हाइड्रेशन:</b>
[हाइड्रेशन की आवश्यकता]

<b>नमूना भोजन योजना (शाकाहारी या मांसाहारी चुनें):</b>
🍳 <b>नाश्ता:</b> [दोनों विकल्प]
🍲 <b>दोपहर का भोजन:</b> [दोनों विकल्प]
🥘 <b>रात का भोजन:</b> [दोनों विकल्प]
🥤 <b>स्नैक्स:</b> [विकल्प]

<b>📋 अस्वीकरण:</b> यह सामान्य मार्गदर्शन है। कृपया अपने डॉक्टर की विशिष्ट सिफारिशों का पालन करें। हर गर्भावस्था अद्वितीय है।

सप्ताह ${currentWeek} के लिए दोनों आहार विकल्प के साथ व्यावहारिक बनाएं।`;

        const nutritionMsg = await geminiService.generateResponse(nutritionPrompt, userLanguage, []);

        // Return messages - frontend will show them one by one
        res.json({
            message: 'Registration successful!',
            user,
            messages: [
                { type: 'welcome', content: welcomeMsg },
                { type: 'ayurvedic', content: ayurvedicMsg },
                { type: 'nutrition', content: nutritionMsg }
            ],
            currentWeek
        });
    } catch (error) {
        console.error('Registration API Error:', error);
        res.status(500).json({ error: 'Failed to register' });
    }
});

// Test health check notification endpoint (for testing only)
app.post('/api/test-notification', async (req, res) => {
    try {
        await pregnancyService.sendWeeklyUpdates(bot);
        res.json({ success: true, message: 'Health check notifications sent to all active users' });
    } catch (error) {
        console.error('Error sending test notifications:', error);
        res.status(500).json({ error: 'Failed to send notifications' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Sugam Garbh Bot is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Sugam Garbh Telegram Bot started successfully!');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});
