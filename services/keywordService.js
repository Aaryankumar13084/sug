const hindiKeywords = require('../data/keywords');
const englishKeywords = require('../data/keywords-english');

class KeywordService {
    constructor() {
        this.hindiKeywords = hindiKeywords;
        this.englishKeywords = englishKeywords;
    }

    getResponse(text, language = 'hindi') {
        const cleanText = text.toLowerCase().trim();
        
        // Check keywords in both languages but return response in preferred language
        const allKeywords = { ...this.hindiKeywords, ...this.englishKeywords };
        
        // Find matching keyword from either language
        let matchedKeyword = null;
        for (const keyword of Object.keys(allKeywords)) {
            if (cleanText.includes(keyword)) {
                matchedKeyword = keyword;
                break;
            }
        }
        
        if (matchedKeyword) {
            // Return response in user's preferred language
            const responseKeywords = language === 'english' ? this.englishKeywords : this.hindiKeywords;
            
            // If keyword exists in preferred language, use it
            if (responseKeywords[matchedKeyword]) {
                return responseKeywords[matchedKeyword];
            }
            
            // If not, find equivalent keyword in preferred language
            const keywordMappings = {
                // Hindi to English mappings
                'कब्ज': 'constipation',
                'टीकाकरण': 'vaccination', 
                'आहार': 'diet',
                'चिंता': 'anxiety',
                'व्यायाम': 'exercise',
                'सिरदर्द': 'headache',
                'उल्टी': 'vomiting',
                'रक्तचाप': 'bp',
                'मधुमेह': 'diabetes',
                'नींद': 'sleep',
                // English to Hindi mappings
                'constipation': 'कब्ज',
                'vaccination': 'टीकाकरण',
                'diet': 'आहार', 
                'anxiety': 'चिंता',
                'exercise': 'व्यायाम',
                'headache': 'सिरदर्द',
                'vomiting': 'उल्टी',
                'bp': 'रक्तचाप',
                'diabetes': 'मधुमेह',
                'sleep': 'नींद',
                // Additional mappings
                'kabz': language === 'english' ? 'constipation' : 'कब्ज',
                'tikakaran': language === 'english' ? 'vaccination' : 'टीकाकरण',
                'aahar': language === 'english' ? 'diet' : 'आहार',
                'chinta': language === 'english' ? 'anxiety' : 'चिंता',
                'vyayam': language === 'english' ? 'exercise' : 'व्यायाम',
                'sirdard': language === 'english' ? 'headache' : 'सिरदर्द',
                'ulti': language === 'english' ? 'vomiting' : 'उल्टी',
                'raktchap': language === 'english' ? 'bp' : 'रक्तचाप',
                'sugar': language === 'english' ? 'diabetes' : 'मधुमेह',
                'neend': language === 'english' ? 'sleep' : 'नींद'
            };
            
            const equivalentKeyword = keywordMappings[matchedKeyword];
            if (equivalentKeyword && responseKeywords[equivalentKeyword]) {
                return responseKeywords[equivalentKeyword];
            }
        }
        
        return null;
    }
}

module.exports = KeywordService;
