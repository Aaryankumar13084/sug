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
Keep your response clear, concise, and well-formatted. Use simple language that's easy to understand.
Focus on practical advice for pregnancy-related topics. Use appropriate emojis to make the response more engaging.
Format your response with clear sections using emojis like 🩺, 💡, ⚠️, 🍎, 💊, etc.`;
                fullPrompt = `${languageContext}\n\nQuestion: ${prompt}`;
            } else {
                languageContext = `आप एक सहायक गर्भावस्था सहायक हैं। कृपया केवल हिंदी में उत्तर दें। 
अपना उत्तर स्पष्ट, संक्षिप्त और अच्छी तरह से स्वरूपित रखें। सरल भाषा का उपयोग करें जो समझने में आसान हो।
गर्भावस्था संबंधी विषयों के लिए व्यावहारिक सलाह पर ध्यान दें। उत्तर को आकर्षक बनाने के लिए उपयुक्त इमोजी का उपयोग करें।
🩺, 💡, ⚠️, 🍎, 💊, आदि जैसी इमोजी के साथ स्पष्ट खंडों में अपना उत्तर प्रारूपित करें।`;
                fullPrompt = `${languageContext}\n\nप्रश्न: ${prompt}`;
            }
            
            const result = await this.model.generateContent(fullPrompt);
            const response = await result.response;
            let responseText = response.text();
            
            // Clean up formatting - improve bullet points and structure
            responseText = responseText
                .replace(/\*\*\*/g, '') // Remove triple asterisks
                .replace(/\*\*([^*]+)\*\*/g, '📌 $1') // Convert **text** to 📌 text
                .replace(/\*([^*]+)\*/g, '• $1') // Convert *text* to bullet points
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
                .replace(/• •/g, '•') // Fix double bullet points
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