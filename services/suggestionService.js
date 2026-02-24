const KeywordService = require('./keywordService');
const OpenRouterService = require('./openRouterService');

class SuggestionService {
    constructor() {
        this.keywordService = new KeywordService();
        this.openRouterService = new OpenRouterService();

        // Map of keywords to topics
        this.topicMap = {
            'kabz': 'constipation',
            'कब्ज': 'constipation',
            'constipation': 'constipation',

            'ulti': 'vomiting',
            'उल्टी': 'vomiting',
            'vomiting': 'vomiting',

            'aahar': 'diet',
            'diet': 'diet',
            'खाना': 'diet',
            'आहार': 'diet',

            'chinta': 'anxiety',
            'चिंता': 'anxiety',
            'anxiety': 'anxiety',

            'vyayam': 'exercise',
            'व्यायाम': 'exercise',
            'exercise': 'exercise',

            'sirdard': 'headache',
            'सिरदर्द': 'headache',
            'headache': 'headache',

            'tikakaran': 'vaccination',
            'टीकाकरण': 'vaccination',
            'vaccination': 'vaccination',

            'raktchap': 'blood_pressure',
            'रक्तचाप': 'blood_pressure',
            'bp': 'blood_pressure',

            'diabetes': 'diabetes',
            'मधुमेह': 'diabetes',
            'sugar': 'diabetes',

            'neend': 'sleep',
            'नींद': 'sleep',
            'sleep': 'sleep'
        };
    }

    /**
     * Extract topics from conversation history
     * @param {Array} messages - Array of message objects with text
     * @returns {Array} Array of detected topics
     */
    extractTopicsFromHistory(messages) {
        const topics = new Set();

        messages.forEach((msg, idx) => {
            const text = msg.text || msg.question || msg.answer || '';
            const lowerText = text.toLowerCase();

            // Check each keyword mapping
            Object.entries(this.topicMap).forEach(([keyword, topic]) => {
                const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b|${keyword.toLowerCase()}`, 'i');
                if (regex.test(text)) {
                    console.log(`[History] Message ${idx}: Found "${keyword}" -> ${topic}`);
                    topics.add(topic);
                }
            });
        });

        console.log(`[History] Extracted topics:`, Array.from(topics));
        return Array.from(topics);
    }

    /**
     * Detect topic from current message
     * @param {String} message - Current message
     * @returns {String} Detected topic
     */
    detectCurrentTopic(message) {
        const lowerMessage = message.toLowerCase();

        for (const [keyword, topic] of Object.entries(this.topicMap)) {
            // For Hindi text, just use simple includes since word boundaries don't work well
            const keywordLower = keyword.toLowerCase();
            if (message.includes(keyword) || lowerMessage.includes(keywordLower)) {
                console.log(`[Topic Detection] ✅ Matched "${keyword}" -> topic: ${topic}`);
                return topic;
            }
        }

        // Fallback to common patterns
        if (message.includes('कब्ज') || message.includes('kabz') || lowerMessage.includes('constipation')) {
            console.log(`[Topic Detection] ✅ Matched constipation (fallback)`);
            return 'constipation';
        }

        console.log(`[Topic Detection] ⚠️ No topic matched, returning 'general'`);
        return 'general'; // Default topic
    }

    /**
     * Get suggestions for the current chat session
     * @param {Array} sessionHistory - Chat session messages
     * @param {String} currentMessage - Current user message
     * @param {String} language - Language preference (hindi or english)
     * @returns {Promise<Array>} Array of suggestion strings
     */
    async getSuggestions(sessionHistory, currentMessage, language = 'hindi') {
        try {
            console.log(`\n========================================`);
            console.log(`[SuggestionService] 🔍 Getting suggestions`);
            console.log(`[SuggestionService] Message: "${currentMessage.substring(0, 50)}..."`);
            console.log(`[SuggestionService] History length: ${sessionHistory.length}`);
            console.log(`[SuggestionService] Language: ${language}`);

            if (sessionHistory.length === 0) {
                console.log(`[SuggestionService] ⚠️  Empty history`);
            } else {
                console.log(`[SuggestionService] History:`, sessionHistory.map(h => ({
                    q: h.question?.substring(0, 40),
                    a: h.answer?.substring(0, 40)
                })));
            }

            // Extract topics from session history
            const sessionTopics = this.extractTopicsFromHistory(sessionHistory);
            console.log(`[SuggestionService] ✅ Session topics:`, sessionTopics);

            // Detect current topic
            const currentTopic = this.detectCurrentTopic(currentMessage);
            console.log(`[SuggestionService] ✅ Current topic: ${currentTopic}`);

            // Build final topics list
            const allTopics = [...new Set([...sessionTopics, currentTopic])].filter(t => t !== 'general');

            console.log(`[getSuggestions] Final topics list:`, allTopics);
            console.log(`[getSuggestions] allTopics.length:`, allTopics.length);

            // Try to generate suggestions if we have any topics
            if (allTopics.length > 0) {
                console.log(`[getSuggestions] 📞 Calling OpenRouter with topics:`, allTopics);
                try {
                    const suggestions = await this.openRouterService.generateSuggestions(
                        allTopics,
                        currentTopic !== 'general' ? currentTopic : allTopics[0],
                        language
                    );

                    console.log(`[getSuggestions] Response from OpenRouter:`, suggestions?.length || 0, 'suggestions');
                    if (suggestions && suggestions.length > 0) {
                        console.log(`[getSuggestions] ✅ Got suggestions:`, suggestions);
                        return suggestions;
                    } else {
                        console.warn(`[getSuggestions] ⚠️  OpenRouter returned empty array`);
                    }
                } catch (err) {
                    console.error(`[getSuggestions] ❌ Error calling OpenRouter:`, err.message);
                }
            } else {
                console.log(`[getSuggestions] ⚠️  No topics found (currentTopic=${currentTopic}, sessionTopics=${sessionTopics.length})`);
            }

            console.log(`[getSuggestions] 📤 Returning empty suggestions`);
            return [];
        } catch (error) {
            console.error('Error in getSuggestions:', error);
            return [];
        }
    }

    /**
     * Format suggestions for display in chat
     * @param {Array} suggestions - Array of suggestion strings
     * @param {String} language - Language preference
     * @returns {String} Formatted suggestions for display
     */
    formatSuggestions(suggestions, language = 'hindi') {
        if (!suggestions || suggestions.length === 0) {
            return '';
        }

        const header = language === 'english'
            ? '💡 <b>Related Questions:</b>'
            : '💡 <b>संबंधित प्रश्न:</b>';

        const formattedSuggestions = suggestions
            .map((suggestion, index) => `${index + 1}. ${suggestion}`)
            .join('\n');

        return `\n\n${header}\n${formattedSuggestions}`;
    }

    /**
     * Get suggestions as inline buttons (for Telegram)
     * @param {Array} suggestions - Array of suggestion strings
     * @returns {Array} Array of button rows for Telegram inline keyboard
     */
    getSuggestionsAsButtons(suggestions) {
        if (!suggestions || suggestions.length === 0) {
            return [];
        }

        return suggestions.map(suggestion => [
            {
                text: suggestion.substring(0, 60) + (suggestion.length > 60 ? '...' : ''),
                callback_data: `suggestion_${Buffer.from(suggestion).toString('base64')}`
            }
        ]);
    }
}

module.exports = SuggestionService;
