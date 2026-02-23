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
            const url = `${this.baseURL}/models/gemini-2.0-flash:generateContent`;

            let languageContext;
            if (language === 'english') {
                languageContext = `You are a helpful pregnancy support assistant named Sugam Assistant. Please respond ONLY in English.

RESPONSE PRIORITY RULES:
- Always prioritize safe home remedies (desi nuskhe) and natural solutions first.
- Only suggest medicines/medications when the user explicitly asks for medicine.
- Keep your initial response SHORT (3-5 bullet points max). Only give a detailed/long response when the user asks for more detail.
- Always add a disclaimer: "Consult your doctor before trying any remedy."

FORMATTING:
- Use clear paragraphs and bullet points.
- Start sections with emojis (🩺, 💡, ⚠️, 🍎, 💊).`;
            } else {
                languageContext = `आप एक सहायक गर्भावस्था सहायक हैं जिनका नाम सुगम सहायक है। कृपया केवल हिंदी में उत्तर दें।

जवाब देने के नियम:
- हमेशा पहले सुरक्षित देसी नुस्खे और घरेलू उपाय बताएं।
- दवाई तभी बताएं जब उपयोगकर्ता खुद दवाई के बारे में पूछे।
- पहले छोटा जवाब दें (3-5 बुलेट पॉइंट)। विस्तार से तभी बताएं जब उपयोगकर्ता कहे।
- हमेशा अंत में लिखें: "कोई भी उपाय आजमाने से पहले अपने डॉक्टर से सलाह लें।"

फॉर्मेटिंग:
- स्पष्ट पैराग्राफ और बुलेट पॉइंट का उपयोग करें।
- सेक्शन की शुरुआत इमोजी (🩺, 💡, ⚠️, 🍎, 💊) से करें।`;
            }

            const contents = [
                { role: 'user', parts: [{ text: languageContext }] },
                { role: 'model', parts: [{ text: language === 'english' ? 'I understand.' : 'मैं समझ गया।' }] }
            ];

            const recentHistory = conversationHistory.slice(-5);
            for (const entry of recentHistory) {
                contents.push({ role: 'user', parts: [{ text: entry.question }] });
                contents.push({ role: 'model', parts: [{ text: entry.answer }] });
            }

            contents.push({ role: 'user', parts: [{ text: prompt }] });

            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': this.apiKey
                },
                body: JSON.stringify({ contents })
            });

            if (!response.ok) throw new Error(`AI API error: ${response.status}`);

            const data = await response.json();
            let responseText = data.candidates[0].content.parts[0].text;

            return responseText.trim();
        } catch (error) {
            console.error('Error generating Gemini response:', error);
            return language === 'english' ? 'Sorry, I could not generate a response.' : 'क्षमा करें, मैं अभी उत्तर नहीं दे सकता।';
        }
    }

    isAvailable() {
        return !!this.apiKey && !!this.baseURL;
    }
}

module.exports = GeminiService;