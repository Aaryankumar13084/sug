const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const cron = require('node-cron');
require('dotenv').config();

const connectDB = require('./config/database');
const BotService = require('./services/botService');
const PregnancyService = require('./services/pregnancyService');

const app = express();
const PORT = process.env.PORT || 8000;

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
