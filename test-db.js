const mongoose = require('mongoose');
const ChatSession = require('./models/ChatSession');
const connectDB = require('./config/database');
require('dotenv').config();

async function check() {
    await connectDB();
    try {
        const session = new ChatSession({
            userSessionId: "test_debug",
            title: "Debug Session"
        });
        await session.save();
        console.log("Session saved:", session._id);

        const doc = await ChatSession.findById(session._id);
        console.log("Loaded doc.");

        doc.messages.push({ role: 'user', text: "Hello AI" });
        doc.messages.push({ role: 'model', text: "Hello! Note: This is a test." });
        await doc.save();
        console.log("Messages saved.");

        const doc2 = await ChatSession.findById(session._id);
        console.log("Loaded doc2 messages:", JSON.stringify(doc2.messages, null, 2));
    } catch (e) {
        console.error("DEBUG ERROR:", e);
    }
    process.exit(0);
}
check();
