# Sugam Garbh Telegram Bot

## Overview
A Telegram bot for pregnancy tracking that provides weekly updates, health checks, and support in Hindi and English.

## Recent Changes
- 2026-02-22: Initial import to Replit environment. Installed Node.js 20 and npm packages. Set up workflow and .gitignore.

## Project Architecture
- **Runtime**: Node.js 20
- **Framework**: Express.js (health/status endpoints)
- **Bot**: node-telegram-bot-api (polling mode)
- **Database**: MongoDB via Mongoose
- **Scheduling**: node-cron for daily/weekly tasks
- **AI**: @google/generative-ai

### Structure
- `index.js` - Main entry point, Express server + bot initialization + cron jobs
- `config/` - Database connection config
- `models/` - Mongoose models
- `services/` - Bot service and pregnancy service logic
- `utils/` - Utility functions
- `data/` - Static data files

### Required Environment Variables
- `TELEGRAM_BOT_TOKEN` - Telegram bot API token (required)
- `MONGODB_URI` - MongoDB connection string
- `ENCRYPTION_KEY` - 32-character encryption key
- `PORT` - Server port (default: 8000)
- `NODE_ENV` - Environment mode

## User Preferences
- None recorded yet
