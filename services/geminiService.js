const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            console.warn('GEMINI_API_KEY not found in environment variables');
            this.genAI = null;
            return;
        }
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async generateResponse(prompt, language = 'hindi') {
        if (!this.genAI) {
            return language === 'english' 
                ? 'Gemini AI service is not available. Please configure GEMINI_API_KEY.'
                : 'जेमिनी AI सेवा उपलब्ध नहीं है। कृपया GEMINI_API_KEY कॉन्फ़िगर करें।';
        }

        try {
            let languageContext, fullPrompt;
            
            if (language === 'english') {
                languageContext = `You are a helpful pregnancy support assistant. Please respond ONLY in English.

FORMATTING RULES:
- Keep responses clear and well-organized
- Use simple, easy-to-understand language
- Start each main section with ONE emoji (🩺, 💡, ⚠️, 🍎, or 💊)
- Use bullet points (•) for lists, not multiple emojis
- Keep paragraphs short and readable
- Limit emojis to section headers only
- Focus on practical, actionable advice

Provide helpful pregnancy guidance without overwhelming formatting.`;
                fullPrompt = `${languageContext}\n\nQuestion: ${prompt}`;
            } else {
                languageContext = `आप एक सहायक गर्भावस्था सहायक हैं। कृपया केवल हिंदी में उत्तर दें।

फॉर्मेटिंग नियम:
- उत्तर स्पष्ट और व्यवस्थित रखें
- सरल, समझने योग्य भाषा का उपयोग करें
- प्रत्येक मुख्य सेक्शन की शुरुआत एक इमोजी से करें (🩺, 💡, ⚠️, 🍎, या 💊)
- सूचियों के लिए बुलेट पॉइंट (•) का उपयोग करें, कई इमोजी का नहीं
- पैराग्राफ छोटे और पढ़ने योग्य रखें
- इमोजी केवल सेक्शन हेडर तक सीमित रखें
- व्यावहारिक, कार्यान्वित करने योग्य सलाह पर ध्यान दें

बिना अत्यधिक फॉर्मेटिंग के उपयोगी गर्भावस्था मार्गदर्शन प्रदान करें।`;
                fullPrompt = `${languageContext}\n\nप्रश्न: ${prompt}`;
            }
            
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            let responseText = response.text();
            
            // Clean up formatting - improve structure and readability
            responseText = responseText
                .replace(/\*\*\*/g, '') // Remove triple asterisks
                .replace(/\*\*([^*]+)\*\*/g, '🔸 $1') // Convert **text** to 🔸 text (less frequent emoji)
                .replace(/\*([^*]+)\*/g, '• $1') // Convert *text* to bullet points
                .replace(/\n\s*\n\s*\n+/g, '\n\n') // Remove excessive line breaks
                .replace(/• •/g, '•') // Fix double bullet points
                .replace(/🔸\s*🔸/g, '🔸') // Fix double pin emojis
                .replace(/📌/g, '🔸') // Replace any remaining pin emojis with consistent ones
                .replace(/\n{3,}/g, '\n\n') // Limit to maximum 2 line breaks
                .replace(/^\s+|\s+$/gm, '') // Remove leading/trailing spaces from each line
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
        return this.genAI !== null;
    }
}

module.exports = GeminiService;