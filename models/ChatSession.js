const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSessionSchema = new mongoose.Schema({
    userSessionId: {
        type: String,
        required: false,
        index: true
    },
    telegramId: {
        type: String,
        required: false,
        index: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [messageSchema]
}, { timestamps: true });

// Ensure at least one identifier is present
chatSessionSchema.pre('save', function (next) {
    if (!this.userSessionId && !this.telegramId) {
        next(new Error('Either userSessionId or telegramId must be provided'));
    } else {
        next();
    }
});

// Assuming messages are also sensitive, we can encrypt/decrypt them
chatSessionSchema.pre('save', function (next) {
    if (this.isModified('messages')) {
        this.messages.forEach(msg => {
            // Only encrypt if not already encrypted
            if (msg.text && typeof msg.text === 'string' && !msg.text.includes(':')) {
                const encrypted = encrypt(msg.text);
                if (encrypted) msg.text = encrypted;
            }
        });
    }
    next();
});

chatSessionSchema.post('find', function (docs) {
    if (Array.isArray(docs)) {
        docs.forEach(doc => {
            if (doc.messages) {
                doc.messages.forEach(msg => {
                    const decrypted = decrypt(msg.text);
                    if (decrypted) msg.text = decrypted;
                });
            }
        });
    }
});

chatSessionSchema.post('findOne', function (doc) {
    if (doc && doc.messages) {
        doc.messages.forEach(msg => {
            const decrypted = decrypt(msg.text);
            if (decrypted) msg.text = decrypted;
        });
    }
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = ChatSession;
