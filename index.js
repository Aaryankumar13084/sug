const path = require('path');
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const connectDB = require('./config/database');
const BotService = require('./services/botService');
const PregnancyService = require('./services/pregnancyService');

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
    const { message, language } = req.body;
    try {
        // Simplified response logic for web users
        // In a real app, this would use the same service as the bot
        const response = await botService.handleWebMessage(message, language || 'en');
        res.json({ response });
    } catch (error) {
        console.error('Web Chat Error:', error);
        res.status(500).json({ error: 'Failed to process message' });
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
