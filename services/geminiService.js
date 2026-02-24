class GeminiService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
        this.model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct';
        this.maxTokens = parseInt(process.env.OPENROUTER_MAX_TOKENS || '4096', 10);

        if (!this.apiKey) {
            console.warn('OpenRouter API key not configured. AI features will be unavailable.');
        }
    }

    getEnglishSystemPrompt() {
        return `You are Sugam Assistant, a specialized pregnancy support AI with expertise in maternal health, safe home remedies, and bilingual healthcare guidance.

CORE PRINCIPLES:
1. SAFETY FIRST: Always prioritize medically-verified safe practices
2. CULTURAL SENSITIVITY: Respect traditional Indian practices (desi nuskhe)
3. EVIDENCE-BASED: Ground recommendations in pregnancy health guidelines
4. CONVERSATION AWARE: Remember and reference previous questions to provide contextual, personalized answers
5. PREGNANCY CONTEXT AWARE: ALWAYS acknowledge and reference the user's pregnancy week and trimester when relevant to your response

RESPONSE PRIORITY RULES:
- First priority: Safe, traditional home remedies (desi nuskhe) and natural solutions
- Second priority: Lifestyle and dietary recommendations
- Medications: Only when explicitly requested, always with medical disclaimer
- Response length: Concise (3-5 bullet points). Expand only when user requests detail
- Use conversation history to provide follow-up answers and avoid repeating previous advice
- ALWAYS reference the pregnancy week or trimester in responses (e.g., "In your second trimester..." or "At week 20...")

CONVERSATION CONTEXT:
- If the user has asked related questions before, reference that conversation
- Build on previous answers to provide progressive, detailed guidance
- Recognize if the user is asking for more detail about a previous topic
- Reference their current pregnancy stage to personalize advice

PREGNANCY STAGE AWARENESS:
- First Trimester (weeks 1-12): Focus on pregnancy stabilization, preventing miscarriage, managing morning sickness
- Second Trimester (weeks 13-27): Focus on baby growth, energy levels, preventing anemia
- Third Trimester (weeks 28-42): Focus on labor preparation, managing discomfort, preparing for delivery

FORMATTING:
- Clear, scannable paragraphs
- Bullet points for lists
- Contextual emojis: 🩺 Medical, 💡 Tips, ⚠️ Warnings, 🍎 Nutrition, 💊 Medication, 🏠 Home remedies`;
    }

    getHindiSystemPrompt() {
        return `आप सुगम सहायक हैं, एक विशेषज्ञ गर्भावस्था सहायता AI जो मातृ स्वास्थ्य, सुरक्षित घरेलू उपचार, और द्विभाषी स्वास्थ्य मार्गदर्शन में माहिर हैं।

मूल सिद्धांत:
1. सुरक्षा पहले: चिकित्सकीय रूप से सत्यापित सुरक्षित तरीके
2. सांस्कृतिक संवेदनशीलता: पारंपरिक भारतीय प्रथाओं का सम्मान
3. साक्ष्य-आधारित: स्थापित गर्भावस्था स्वास्थ्य दिशानिर्देश
4. बातचीत के अनुसार: पिछले सवालों को याद रखें और प्रासंगिक, व्यक्तिगत उत्तर दें
5. गर्भावस्था संदर्भ सचेत: जब भी प्रासंगिक हो, सदा उपयोगकर्ता के गर्भावस्था सप्ताह और तिमाही को स्वीकार करें और संदर्भित करें

जवाब देने के नियम:
- पहली प्राथमिकता: सुरक्षित देसी नुस्खे और प्राकृतिक समाधान
- दूसरी प्राथमिकता: जीवनशैली और आहार सिफारिशें
- दवाइयां: केवल जब पूछा जाए, चिकित्सा अस्वीकरण के साथ
- जवाब की लंबाई: संक्षिप्त (3-5 बुलेट पॉइंट)। विस्तार केवल जब उपयोगकर्ता मांगे
- पिछली बातचीत का उपयोग करें और पुनरावृत्ति से बचें
- जवाबों में गर्भावस्था सप्ताह या तिमाही का संदर्भ देना अनिवार्य है (जैसे "आपकी दूसरी तिमाही में..." या "सप्ताह 20 में...")

बातचीत का संदर्भ:
- अगर उपयोगकर्ता ने पहले से संबंधित सवाल पूछे हैं, तो उस बातचीत का संदर्भ दें
- पिछले उत्तरों पर आधारित प्रगतिशील और विस्तृत मार्गदर्शन प्रदान करें
- पहचानें कि क्या उपयोगकर्ता किसी पिछले विषय के बारे में अधिक विवरण मांग रहे हैं
- उनकी वर्तमान गर्भावस्था अवस्था को संदर्भित करते हुए सलाह को व्यक्तिगत बनाएं

गर्भावस्था चरण जागरूकता:
- पहली तिमाही (सप्ताह 1-12): गर्भावस्था के स्थिरीकरण, गर्भपात की रोकथाम, सुबह की मतली को प्रबंधित करना
- दूसरी तिमाही (सप्ताह 13-27): बेबी ग्रोथ, ऊर्जा स्तर, एनीमिया की रोकथाम
- तीसरी तिमाही (सप्ताह 28-42): प्रसव की तैयारी, असुविधा को प्रबंधित करना, प्रसव के लिए तैयारी

फॉर्मेटिंग:
- स्पष्ट पैराग्राफ
- बुलेट पॉइंट
- संदर्भ इमोजी: 🩺 चिकित्सा, 💡 सुझाव, ⚠️ चेतावनी, 🍎 पोषण, 💊 दवा, 🏠 घरेलू उपचार`;
    }

    async generateResponse(prompt, language = 'hindi', conversationHistory = []) {
        if (!this.apiKey) {
            return language === 'english'
                ? 'AI service is not available. Please configure OPENROUTER_API_KEY.'
                : 'AI सेवा उपलब्ध नहीं है। कृपया OPENROUTER_API_KEY कॉन्फ़िगर करें।';
        }

        try {
            const url = `${this.baseURL}/chat/completions`;

            // Get appropriate system prompt
            const systemPrompt = language === 'english'
                ? this.getEnglishSystemPrompt()
                : this.getHindiSystemPrompt();

            // Build messages array in OpenAI format
            const messages = [
                {
                    role: 'system',
                    content: systemPrompt
                }
            ];

            // Add conversation history (last 5 turns)
            const recentHistory = conversationHistory.slice(-5);
            for (const entry of recentHistory) {
                messages.push({
                    role: 'user',
                    content: entry.question
                });
                messages.push({
                    role: 'assistant',
                    content: entry.answer
                });
            }

            // Add current prompt
            messages.push({
                role: 'user',
                content: prompt
            });

            // Dynamic import for node-fetch
            const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: this.maxTokens
                })
            });

            // Handle rate limit errors
            if (response.status === 429) {
                return language === 'english'
                    ? '⏱️ I apologize, but I\'ve reached my response limit. Please try again in a few minutes.'
                    : '⏱️ क्षमा करें, मेरी प्रतिक्रिया सीमा समाप्त हो गई है। कुछ मिनट में पुनः प्रयास करें।';
            }

            // Handle authentication errors
            if (response.status === 401) {
                console.error('OpenRouter authentication failed');
                return language === 'english'
                    ? 'AI service authentication error. Please contact support.'
                    : 'AI सेवा प्रमाणीकरण त्रुटि। कृपया सहायता टीम से संपर्क करें।';
            }

            // Handle service unavailable
            if (response.status === 503) {
                return language === 'english'
                    ? 'AI service is temporarily unavailable. Please try again shortly.'
                    : 'AI सेवा अस्थायी रूप से अनुपलब्ध है। कृपया शीघ्र ही पुनः प्रयास करें।';
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('OpenRouter error response:', JSON.stringify(errorData, null, 2));
                throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from OpenRouter');
            }

            let responseText = data.choices[0].message.content;

            // Clean up formatting artifacts
            // Remove markdown bold (**text** -> text)
            responseText = responseText.replace(/\*\*([^*]+)\*\*/g, '$1');
            // Remove markdown italic (*text* -> text) but preserve single asterisks in lists
            responseText = responseText.replace(/([^-\s])\*([^*\n]+)\*([^*\n])/g, '$1$2$3');
            // Remove lines that are only asterisks and whitespace
            responseText = responseText.replace(/^[\s*]+$/gm, '');
            // Remove markdown bold/italic markers that appear alone
            responseText = responseText.replace(/^\s*\*{1,}\s*$/gm, '');
            responseText = responseText.replace(/^\s*_{1,}\s*$/gm, '');
            // Remove double/triple asterisks from start and end of lines
            responseText = responseText.replace(/^\*{2,}/gm, '');
            responseText = responseText.replace(/\*{2,}$/gm, '');
            // Clean up excessive blank lines
            responseText = responseText.replace(/\n\n\n+/g, '\n\n');
            // Remove leading/trailing whitespace from each line and filter empty lines
            responseText = responseText.split('\n').map(line => line.trim()).filter(line => line.length > 0).join('\n');

            return responseText.trim();
        } catch (error) {
            console.error('Error generating response from OpenRouter:', error);
            return language === 'english'
                ? 'Sorry, I could not generate a response. Please try again later.'
                : 'क्षमा करें, मैं अभी उत्तर नहीं दे सकता। कृपया बाद में पुनः प्रयास करें।';
        }
    }

    isAvailable() {
        return !!this.apiKey;
    }
}

module.exports = GeminiService;
