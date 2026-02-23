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
const { parseDate, isValidDate, isValidConceptionDate } = require('./utils/dateUtils');

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
const BOT_TOKEN = '8166845761:AAH0Ik831wdflah3Zum5CQ6sM0gocKvgMZI';

if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is required in environment variables');
    process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const botService = new BotService(bot);
const pregnancyService = new PregnancyService();

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
        const response = await botService.handleWebMessage(message, language || 'hi', sessionId, chatSessionId);
        res.json({ response });
    } catch (error) {
        console.error('Web Chat Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

// Get all chat sessions for a web user
app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const sessions = await ChatSession.find({ userSessionId: req.params.sessionId })
            .select('title createdAt updatedAt')
            .sort({ updatedAt: -1 });
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
        const newSession = new ChatSession({
            userSessionId: sessionId,
            title: title || 'New Chat'
        });
        await newSession.save();
        res.status(201).json({ session: newSession });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Get a specific chat session's messages
app.get('/api/sessions/:sessionId/:chatSessionId', async (req, res) => {
    try {
        const session = await ChatSession.findOne({
            _id: req.params.chatSessionId,
            userSessionId: req.params.sessionId
        });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.json({ session });
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
    const { firstName, conceptionDate, sessionId } = req.body;
    try {
        const dueDate = parseDate(conceptionDate);
        if (!dueDate || !isValidDate(dueDate) || !isValidConceptionDate(dueDate)) {
            return res.status(400).json({ error: 'Invalid date. Please use DD/MM/YYYY format and ensure it is within the last 10 months.' });
        }

        // Use sessionId to find and update or create new user
        // This ensures a session only has one user profile
        const user = await User.findOneAndUpdate(
            { sessionId: sessionId },
            {
                firstName: firstName,
                dueDate: dueDate,
                registrationSource: 'web',
                isActive: true,
                consentGiven: true
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json({ message: 'Registration successful!', user });
    } catch (error) {
        console.error('Registration API Error:', error);
        if (error.code === 11000) {
            console.error('Duplicate Key Info:', JSON.stringify(error.keyValue));
            return res.status(400).json({ error: 'Registration failed: Duplicate session or ID error.' });
        }
        res.status(500).json({ error: 'Failed to register' });
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
