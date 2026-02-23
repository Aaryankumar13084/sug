const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function main() {
    // 1. Create a session
    let res = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: "test_final", title: "Final Test" })
    });
    let data = await res.json();
    const chatSessionId = data.session._id;
    console.log("Created session:", chatSessionId);

    // 2. Send a message
    res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            message: "Hello final test!",
            language: "en",
            sessionId: "test_final",
            chatSessionId: chatSessionId
        })
    });
    data = await res.json();
    console.log("Chat response:", data.response.substring(0, 50) + '...');

    // 3. Get session history
    res = await fetch(`http://localhost:5000/api/sessions/test_final/${chatSessionId}`);
    data = await res.json();
    console.log("Session history loaded. Messages count:", data.session.messages.length);
    console.log(JSON.stringify(data.session.messages, null, 2));
}

main().catch(console.error);
