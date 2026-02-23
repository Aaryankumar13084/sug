const GeminiService = require('./services/geminiService');
const dotenv = require('dotenv');
dotenv.config();

async function test() {
    console.log('Testing Gemini API...');
    const service = new GeminiService();
    console.log("Key:", service.apiKey);
    console.log("Base:", service.baseURL);
    try {
        const response = await service.generateResponse("Hello, who are you?", "english", []);
        console.log("Response:", response);
    } catch (e) {
        console.log("Error during generation:", e.message);
    }
}
test();
