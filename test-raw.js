const dotenv = require('dotenv');
dotenv.config();

async function test() {
    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
    const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || 'AIzaSyBjZ3W9JJpUr7pEEl-IWG-oMmpdkTLs3T0';
    const baseURL = 'https://generativelanguage.googleapis.com/v1beta';
    const url = `${baseURL}/models/gemini-1.5-flash:generateContent`;

    const contents = [{
        role: 'user',
        parts: [{ text: "Hello" }]
    }];

    try {
        const response = await fetch(url + '?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ contents })
        });

        console.log("Status:", response.status);
        const data = await response.text();
        console.log("Response Body:", data);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
test();
