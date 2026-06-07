// const express = require('express');
// const bodyParser = require('body-parser');

// const app = express();
// app.use(bodyParser.json());

// // This is a secret token you choose. You will need to enter this in the Meta Dashboard later.
// const VERIFY_TOKEN = "my_super_secret_token_123";

// // ---------------------------------------------------------
// // 1. HANDLE VERIFICATION (GET REQUEST FROM META)
// // ---------------------------------------------------------
// app.get('/webhook', (req, res) => {
//     const mode = req.query['hub.mode'];
//     const token = req.query['hub.verify_token'];
//     const challenge = req.query['hub.challenge'];

//     if (mode && token) {
//         if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//             console.log('WEBHOOK_VERIFIED');
//             // Must return the challenge string as a plain text response
//             res.status(200).send(challenge);
//         } else {
//             // Responds with '403 Forbidden' if verify tokens do not match
//             res.sendStatus(403);
//         }
//     } else {
//         res.sendStatus(400);
//     }
// });

// // ---------------------------------------------------------
// // 2. HANDLE INCOMING MESSAGES (POST REQUEST FROM WHATSAPP)
// // ---------------------------------------------------------
// app.post('/webhook', (req, res) => {
//     const body = req.body;

//     // Check if this is an event from a WhatsApp API
//     if (body.object) {
        
//         // Print the incoming JSON payload to your console so you can see it
//         console.log("\nIncoming webhook:");
//         console.dir(body, { depth: null });
        
//         // Extract the actual message (if it exists in the payload)
//         try {
//             const entry = body.entry[0];
//             const changes = entry.changes[0];
//             const value = changes.value;
            
//             // Check if it's a message
//             if (value.messages && value.messages.length > 0) {
//                 const message = value.messages[0];
//                 const phoneNumber = message.from;
                
//                 if (message.type === 'text') {
//                     const textBody = message.text.body;
//                     console.log(`\n---> Received message from ${phoneNumber}: ${textBody}`);
//                 }
//             }
//         } catch (e) {
//             // Payload didn't match expected structure, maybe it's a status update (delivered/read)
//         }

//         // You MUST return a 200 OK back to WhatsApp to acknowledge receipt
//         res.status(200).send('EVENT_RECEIVED');
        
//     } else {
//         res.sendStatus(404);
//     }
// });

// // Start the server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//     console.log(`Webhook server is listening on port ${PORT}`);
// });
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// --- CONFIGURATION ---
const VERIFY_TOKEN = "my_super_secret_token_123";

// Your WhatsApp Cloud API credentials
const WHATSAPP_TOKEN = "EAASVZANiRWKMBRg0EqjaXapQYxmZBftlagHlhwT0pGgv6twHcV5ShAbpLeIenZA6G5FbtFUGqwsb4ytA0KiZBGguCjFVvroyGZCZAZC5GP6TGq6WXyLJZCfZBYoWHLGAZAA0fVyQCZCH6SpkOycBLxdoeR3d17g7TCMbHEtdl8RH9kZAy7gHvm4VQq7Ht2miD5GnoLyo5ZC8JI3FdVOQuR6Fu2wZDZD";
const PHONE_NUMBER_ID = "1241458505710369";

// Your OpenRouter API Key
const OPENROUTER_API_KEY = "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";


// ---------------------------------------------------------
// HELPER: Fetch news from OpenRouter AI
// ---------------------------------------------------------
async function getFootballNewsFromAI() {
    const prompt = `
    You are a football news intelligence agent.
    Your task is to find and return the 3 most important news stories about Cristiano Ronaldo that are directly related to the FIFA World Cup 2026.
    
    Requirements:
    1. Search only for news published within the last 30 days.
    2. Prioritize Portugal's campaign, Ronaldo's participation, etc.
    3. Ignore transfer rumors.
    4. Rank stories by importance.
    5. Provide Headline, date, source, summary, relevance, URL.
    6. Return exactly 3 stories.
    7. Output ONLY valid JSON in the requested format.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://www.google.com",
                "X-OpenRouter-Title": "Prem",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-20b:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        console.log("Ai response",data);
        // Extract the stringified JSON from the AI's response message
        const aiMessage = data.completion.choices[0].message.content;
        const parsedAIResponse = JSON.parse(aiMessage);
        
        // Return just the headline of the first story
        return parsedAIResponse.stories[0].headline;
    } catch (error) {
        console.error("Error fetching from AI:", error);
        return "Sorry, I couldn't fetch the latest news right now.";
    }
}

// ---------------------------------------------------------
// HELPER: Send WhatsApp Message
// ---------------------------------------------------------
async function sendWhatsAppMessage(toPhoneNumber, textMessage) {
    const url = `https://graph.facebook.com/v25.0/${PHONE_NUMBER_ID}/messages`;
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: toPhoneNumber,
                type: "text",
                text: {
                    preview_url: false,
                    body: textMessage
                }
            })
        });

        const result = await response.json();
        console.log("WhatsApp API Response:", result);
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
    }
}


// ---------------------------------------------------------
// 1. HANDLE VERIFICATION (GET REQUEST FROM META)
// ---------------------------------------------------------
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// ---------------------------------------------------------
// 2. HANDLE INCOMING MESSAGES (POST REQUEST FROM WHATSAPP)
// ---------------------------------------------------------
// Notice: We made this function 'async'
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        // Return a 200 OK immediately so Meta doesn't think the webhook timed out
        res.status(200).send('EVENT_RECEIVED');

        try {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;
            
            // Check if it's a message
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const phoneNumber = message.from; // Get SENDER's phone number dynamically
                
                if (message.type === 'text') {
                    const textBody = message.text.body;
                    console.log(`\n---> Received message from ${phoneNumber}: ${textBody}`);
                    
                    console.log("Fetching news from OpenRouter AI...");
                    const newsHeadline = await getFootballNewsFromAI();
                    
                    console.log(`Sending reply to ${phoneNumber}...`);
                    await sendWhatsAppMessage(phoneNumber, newsHeadline);
                }
            }
        } catch (e) {
            // Ignore status updates
        }
    } else {
        res.sendStatus(404);
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Webhook server is listening on port ${PORT}`);
});
