const hindiKeywords = require('../data/keywords');
const englishKeywords = require('../data/keywords-english');

class KeywordService {
    constructor() {
        this.hindiKeywords = hindiKeywords;
        this.englishKeywords = englishKeywords;
    }

    getResponse(text, language = 'hindi') {
        const cleanText = text.toLowerCase().trim();
        const keywords = language === 'english' ? this.englishKeywords : this.hindiKeywords;
        
        // Check for exact matches first
        for (const [keyword, response] of Object.entries(keywords)) {
            if (cleanText.includes(keyword)) {
                return response;
            }
        }
        
        return null;
    }
}

module.exports = KeywordService;
