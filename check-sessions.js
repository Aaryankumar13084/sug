const mongoose = require('mongoose');
const ChatSession = require('./models/ChatSession');
const connectDB = require('./config/database');
require('dotenv').config();

async function check() {
    await connectDB();
    const sessions = await ChatSession.find({});
    console.log(JSON.stringify(sessions, null, 2));
    process.exit(0);
}
check();
