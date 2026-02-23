const mongoose = require('mongoose');
const ChatSession = require('./models/ChatSession');
const connectDB = require('./config/database');
const fs = require('fs');
require('dotenv').config();

async function check() {
    await connectDB();
    const sessions = await ChatSession.find({});
    fs.writeFileSync('c:/Users/codey/allcode/sug/sessions-utf8.json', JSON.stringify(sessions, null, 2), 'utf8');
    process.exit(0);
}
check();
