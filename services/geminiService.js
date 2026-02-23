const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'AIzaSyBjZ3W9JJpUr7pEEl-IWG-oMmpdkTLs3T0';
        this.baseURL = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

        if (!this.apiKey || !this.baseURL) {
            console.warn('Gemini AI integrations not fully configured.');
        }
    }

    async generateResponse(prompt, language = 'hindi', conversationHistory = []) {
        if (!this.apiKey || !this.baseURL) {
            return language === 'english'
                ? 'Gemini AI service is not available. Please configure GEMINI_API_KEY.'
                : 'जेमिनी AI सेवा उपलब्ध नहीं है। कृपया GEMINI_API_KEY कॉन्फ़िगर करें।';
        }

        try {
            // Replit AI Integrations specific fetch to bypass SDK endpoint issues
            const url = `${this.baseURL}/models/gemini-2.5-flash:generateContent`;

            let languageContext;
            if (language === 'english') {
                languageContext = `You are a helpful pregnancy support assistant. Please respond ONLY in English.

RESPONSE PRIORITY RULES:
- Always prioritize home remedies (desi nuskhe) and natural solutions first
- Only suggest medicines/medications when the user explicitly asks for medicine
- Keep your initial response SHORT (3-5 bullet points max). Only give a detailed/long response when the user asks for more detail (e.g., "tell me more", "explain in detail")
- Always add a disclaimer: "Consult your doctor before trying any remedy."

FORMATTING REQUIREMENTS:
- Write in clear paragraphs with proper line breaks
- Add a blank line between each paragraph
- Start each main section with ONE emoji (🩺, 💡, ⚠️, 🍎, or 💊) followed by text
- Use bullet points (•) for lists, each on a new line
- Keep paragraphs 2-3 sentences maximum
- Add proper spacing between sections
- Use natural paragraph breaks for readability

Example format:
🍎 Home Remedies
• First home remedy here
• Second home remedy here
• Third home remedy here

⚠️ Consult your doctor before trying any remedy.

Provide helpful pregnancy guidance with proper spacing.`;
            } else {
                languageContext = `आप एक सहायक गर्भावस्था सहायक हैं। कृपया केवल हिंदी में उत्तर दें।

जवाब देने के नियम:
- हमेशा पहले देसी नुस्खे और घरेलू उपाय बताएं
- दवाई तभी बताएं जब उपयोगकर्ता खुद दवाई के बारे में पूछे
- पहले छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब उपयोगकर्ता कहे (जैसे "विस्तार से बताओ", "detail me batao")
- हमेशा अंत में लिखें: "कोई भी उपाय आजमाने से पहले अपने डॉक्टर से सलाह लें।"

फॉर्मेटिंग आवश्यकताएं:
- उचित लाइन ब्रेक के साथ स्पष्ट पैराग्राफ में लिखें
- प्रत्येक पैराग्राफ के बीच एक खाली लाइन जोड़ें
- प्रत्येक मुख्य सेक्शन की शुरुआत एक इमोजी (🩺, 💡, ⚠️, 🍎, या 💊) से करें उसके बाद टेक्स्ट
- सूचियों के लिए बुलेट पॉइंट (•) का उपयोग करें, प्रत्येक नई लाइन पर
- पैराग्राफ अधिकतम 2-3 वाक्य रखें
- सेक्शन के बीच उचित स्पेसिंग जोड़ें
- पढ़ने की सुविधा के लिए प्राकृतिक पैराग्राफ ब्रेक का उपयोग करें

उदाहरण फॉर्मेट:
🍎 घरेलू उपाय
• पहला घरेलू उपाय यहाँ
• दूसरा घरेलू उपाय यहाँ
• तीसरा घरेलू उपाय यहाँ

⚠️ कोई भी उपाय आजमाने से पहले अपने डॉक्टर से सलाह लें।

उचित स्पेसिंग के साथ उपयोगी गर्भावस्था मार्गदर्शन प्रदान करें।`;
            }

            // Build contents array with conversation history for context
            const contents = [];

            // Add system context as first user message
            contents.push({
                role: 'user',
                parts: [{ text: languageContext }]
            });
            contents.push({
                role: 'model',
                parts: [{ text: language === 'english' ? 'I understand. I will respond as a pregnancy support assistant in English with proper formatting.' : 'मैं समझ गया। मैं गर्भावस्था सहायक के रूप में हिंदी में उचित फॉर्मेटिंग के साथ उत्तर दूंगा।' }]
            });

            // Add conversation history for context (last 5 exchanges)
            const recentHistory = conversationHistory.slice(-5);
            for (const entry of recentHistory) {
                contents.push({
                    role: 'user',
                    parts: [{ text: entry.question }]
                });
                contents.push({
                    role: 'model',
                    parts: [{ text: entry.answer }]
                });
            }

            // Add the current question
            contents.push({
                role: 'user',
                parts: [{ text: prompt }]
            });

            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                body: JSON.stringify({ contents })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`AI API error: ${response.status} ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts[0]) {
                throw new Error('Invalid response format from AI API');
            }

            let responseText = data.candidates[0].content.parts[0].text;

            // Clean up formatting - improve structure and readability with proper line spacing
            responseText = responseText
                .replace(/\*\*\*/g, '') // Remove triple asterisks
                .replace(/\*\*([^*]+)\*\*/g, '🔸 $1\n') // Convert **text** to 🔸 text with line break
                .replace(/\*([^*]+)\*/g, '• $1') // Convert *text* to bullet points
                .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
                .replace(/• •/g, '•') // Fix double bullet points
                .replace(/🔸\s*🔸/g, '🔸') // Fix double pin emojis
                .replace(/📌/g, '🔸') // Replace any remaining pin emojis with consistent ones
                .replace(/([.!?])\s*([🔸🩺💡⚠️🍎💊])/g, '$1\n\n$2') // Add line breaks before section emojis
                .replace(/([.!?])\s*\n\s*([•])/g, '$1\n• ') // Proper spacing for bullet points
                .replace(/\n{3,}/g, '\n\n') // Limit to maximum 2 line breaks
                .replace(/^\s+|\s+$/gm, '') // Remove leading/trailing spaces from each line
                .replace(/([•])\s*([^•\n]+)\n(?=[•])/g, '$1 $2\n') // Fix bullet point spacing
                .trim();

            return responseText;
        } catch (error) {
            console.error('Error generating Gemini response:', error);
            return language === 'english'
                ? 'Sorry, I could not generate a response at this moment. Please try again later.'
                : 'क्षमा करें, मैं इस समय उत्तर नहीं दे सकता। कृपया बाद में पुनः प्रयास करें।';
        }
    }

    isAvailable() {
        return !!this.apiKey && !!this.baseURL;
    }
}

module.exports = GeminiService;