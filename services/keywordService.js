const { getKeywordResponses } = require('../data/keywords');

class KeywordService {
    constructor() {
        this.keywords = getKeywordResponses();
    }

    getResponse(text) {
        const cleanText = text.toLowerCase().trim();
        
        // Check for exact matches first
        for (const [keyword, response] of Object.entries(this.keywords)) {
            if (cleanText.includes(keyword)) {
                return this.formatResponse(response);
            }
        }
        
        return null;
    }

    formatResponse(response) {
        return `${response.content}

⚠️ <b>याद रखें:</b> ${response.disclaimer}

📋 यह केवल शिक्षा के लिए है। गंभीर समस्या हो तो डॉक्टर से तुरंत मिलें।`;
    }
}

module.exports = KeywordService;
