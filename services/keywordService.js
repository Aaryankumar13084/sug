const hindiKeywords = require('../data/keywords');
const englishKeywords = require('../data/keywords-english');

class KeywordService {
    constructor() {
        this.hindiKeywords = hindiKeywords;
        this.englishKeywords = englishKeywords;
    }

    getResponse(text, language = 'hindi') {
        const cleanText = text.toLowerCase().trim();

        // Always search in the user's preferred language keywords FIRST
        const responseKeywords = language === 'english' ? this.englishKeywords : this.hindiKeywords;
        const otherKeywords = language === 'english' ? this.hindiKeywords : this.englishKeywords;

        // First: check if any keyword from the preferred language matches
        for (const keyword of Object.keys(responseKeywords)) {
            if (cleanText.includes(keyword)) {
                return responseKeywords[keyword];
            }
        }

        // Second: check if any keyword from the other language matches, then map to preferred language response
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
            // Romanized Hindi mappings
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

        for (const keyword of Object.keys(otherKeywords)) {
            if (cleanText.includes(keyword)) {
                // Map to equivalent keyword in preferred language
                const equivalentKeyword = keywordMappings[keyword];
                if (equivalentKeyword && responseKeywords[equivalentKeyword]) {
                    return responseKeywords[equivalentKeyword];
                }
            }
        }

        return null;
    }
}

module.exports = KeywordService;
