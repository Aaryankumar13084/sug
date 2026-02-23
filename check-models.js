const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
async function check() {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBjZ3W9JJpUr7pEEl-IWG-oMmpdkTLs3T0');
    const data = await res.json();
    const models = data.models.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'));
    console.log(models.map(m => m.name));
}
check();
