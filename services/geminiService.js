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
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async generateResponse(prompt, language = 'hindi') {
        if (!this.genAI) {
            return language === 'english' 
                ? 'Gemini AI service is not available. Please configure GEMINI_API_KEY.'
                : 'जेमिनी AI सेवा उपलब्ध नहीं है। कृपया GEMINI_API_KEY कॉन्फ़िगर करें।';
        }

        try {
            // Add language context to the prompt
            const languageContext = language === 'english' 
                ? 'Please respond in English. You are a helpful pregnancy support assistant.'
                : 'कृपया हिंदी में उत्तर दें। आप एक सहायक गर्भावस्था सहायक हैं।';
            
            const fullPrompt = `${languageContext}\n\nUser question: ${prompt}`;
            
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
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