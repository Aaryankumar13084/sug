class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct';
        this.maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS || '2048', 10);

        if (!this.apiKey) {
            console.warn('OpenRouter API key not configured. Suggestion feature will be unavailable.');
        }
    }

    /**
     * Generate smart suggestions based on session topics
     * @param {Array} sessionTopics - Topics discussed in this session
     * @param {String} currentTopic - Current topic being discussed
     * @param {String} language - Language (hindi or english)
     * @returns {Promise<Array>} Array of suggested questions
     */
    async generateSuggestions(sessionTopics, currentTopic, language = 'hindi') {
        if (!this.apiKey) {
            console.warn('OpenRouter API key not configured, skipping suggestions');
            return [];
        }

        try {
            console.log(`[Suggestions] Generating for topics: ${sessionTopics.join(', ')}, current: ${currentTopic}, language: ${language}`);
            const topicsStr = sessionTopics.join(', ');

            const prompt = language === 'english'
                ? `You are a pregnancy health chatbot assistant. Based on the user's session history and current question topic, generate 3 MOST RELEVANT follow-up questions in English.

Session Topics Discussed: ${topicsStr}
Current Topic: ${currentTopic}

Generate EXACTLY 3 follow-up questions that:
1. Are related to the topics discussed
2. Help the user get more detailed information
3. Are practical and pregnancy-specific
4. Are in simple, easy-to-understand language

Format: Return ONLY the 3 questions, one per line, without numbering or bullets.
Each question should be a standalone sentence ending with a question mark.`
                : `आप एक गर्भावस्था स्वास्थ्य चैटबॉट सहायक हैं। उपयोगकर्ता के सत्र इतिहास और वर्तमान प्रश्न विषय के आधार पर, 3 सबसे प्रासंगिक अनुवर्ती प्रश्न हिंदी में उत्पन्न करें।

सत्र में चर्चा के विषय: ${topicsStr}
वर्तमान विषय: ${currentTopic}

ऐसे 3 अनुवर्ती प्रश्न उत्पन्न करें जो:
1. चर्चा किए गए विषयों से संबंधित हों
2. उपयोगकर्ता को अधिक विस्तृत जानकारी प्राप्त करने में मदद करें
3. व्यावहारिक और गर्भावस्था-विशिष्ट हों
4. सरल, समझने में आसान भाषा में हों

प्रारूप: केवल 3 प्रश्न लौटाएं, प्रति पंक्ति एक, संख्या या बुलेट के बिना।
प्रत्येक प्रश्न एक स्वतंत्र वाक्य होना चाहिए जो प्रश्न चिह्न से समाप्त हो।`;

            const response = await this.callOpenRouter(prompt);
            console.log(`[Suggestions] OpenRouter response: ${response.substring(0, 100)}...`);

            // Parse suggestions from response
            const suggestions = response
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0 && line.includes('?'))
                .slice(0, 3); // Take first 3 valid suggestions

            console.log(`[Suggestions] Parsed ${suggestions.length} suggestions:`, suggestions);
            return suggestions;
        } catch (error) {
            console.error('Error generating suggestions from OpenRouter:', error);
            return [];
        }
    }

    async callOpenRouter(prompt) {
        try {
            const url = `${this.baseURL}/chat/completions`;
            console.log(`[OpenRouter] Calling URL: ${url}`);
            console.log(`[OpenRouter] Model: ${this.model}`);
            console.log(`[OpenRouter] Prompt length: ${prompt.length}`);

            // Dynamic import for node-fetch
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: 0.7
                })
            });

            console.log(`[OpenRouter] Response status: ${response.status}`);

            if (response.status === 429) {
                console.error('❌ OpenRouter rate limit hit (429)');
                return '';
            }

            if (response.status === 401) {
                console.error('❌ OpenRouter authentication failed (401)');
                return '';
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ OpenRouter error (${response.status}):`, errorText);
                return '';
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('Invalid response format from OpenRouter');
                return '';
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error calling OpenRouter API:', error);
            return '';
        }
    }
}

module.exports = OpenRouterService;
