const keywords = require('../data/keywords');

class KeywordService {
    constructor() {
        this.keywords = keywords;
    }

    getResponse(text) {
        const cleanText = text.toLowerCase().trim();
        
        // Check for exact matches first
        for (const [keyword, response] of Object.entries(this.keywords)) {
            if (cleanText.includes(keyword)) {
                return response;
            }
        }
        
        return null;
    }
}

module.exports = KeywordService;
