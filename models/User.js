const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    username: String,
    dueDate: {
        type: Date,
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    age: Number,
    location: String,
    parity: Number, // Number of previous pregnancies
    healthConditions: [String],
    lastWeekSent: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    consentGiven: {
        type: Boolean,
        default: false
    },
    language: {
        type: String,
        default: 'hindi'
    },
    feedback: [{
        messageId: String,
        helpful: Boolean,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    healthChecks: [{
        status: {
            type: String,
            enum: ['good', 'issues'],
            required: true
        },
        details: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    conversationHistory: [{
        question: String,
        answer: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Encrypt sensitive data before saving
userSchema.pre('save', function(next) {
    if (this.isModified('location') && this.location) {
        this.location = encrypt(this.location);
    }
    if (this.isModified('healthConditions') && this.healthConditions.length > 0) {
        this.healthConditions = this.healthConditions.map(condition => encrypt(condition));
    }
    next();
});

// Decrypt sensitive data after finding
userSchema.post(['find', 'findOne', 'findOneAndUpdate'], function(docs) {
    if (!docs) return;
    
    const documents = Array.isArray(docs) ? docs : [docs];
    
    documents.forEach(doc => {
        if (doc.location) {
            try {
                doc.location = decrypt(doc.location);
            } catch (error) {
                console.error('Error decrypting location:', error);
                doc.location = null;
            }
        }
        if (doc.healthConditions && doc.healthConditions.length > 0) {
            try {
                doc.healthConditions = doc.healthConditions.map(condition => decrypt(condition));
            } catch (error) {
                console.error('Error decrypting health conditions:', error);
                doc.healthConditions = [];
            }
        }
    });
});

module.exports = mongoose.model('User', userSchema);
