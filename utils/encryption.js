const crypto = require('crypto');

// Ensure the key is exactly 32 bytes for aes-256-cbc
const ENCRYPTION_KEY = Buffer.from((process.env.ENCRYPTION_KEY || 'defaultkey1234567890123456789012').substring(0, 32));
const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;

    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;

    try {
        const textParts = text.split(':');
        const ivHex = textParts.shift();

        // If the first part isn't a valid hex string of the expected IV length, it's not our encrypted format
        if (ivHex.length !== IV_LENGTH * 2) {
            return text;
        }

        const iv = Buffer.from(ivHex, 'hex');
        const encryptedText = textParts.join(':');

        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        // Fallback for old encryption format (if any exist and it was using createCipher)
        try {
            const cipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
            let decrypted = cipher.update(text, 'hex', 'utf8');
            decrypted += cipher.final('utf8');
            return decrypted;
        } catch (innerError) {
            console.error('Decryption error:', error);
            return text;
        }
    }
}

module.exports = { encrypt, decrypt };
