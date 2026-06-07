const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// This is a secret token you choose. You will need to enter this in the Meta Dashboard later.
const VERIFY_TOKEN = "my_super_secret_token_123";

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
            // Must return the challenge string as a plain text response
            res.status(200).send(challenge);
        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// ---------------------------------------------------------
// 2. HANDLE INCOMING MESSAGES (POST REQUEST FROM WHATSAPP)
// ---------------------------------------------------------
app.post('/webhook', (req, res) => {
    const body = req.body;

    // Check if this is an event from a WhatsApp API
    if (body.object) {
        
        // Print the incoming JSON payload to your console so you can see it
        console.log("\nIncoming webhook:");
        console.dir(body, { depth: null });
        
        // Extract the actual message (if it exists in the payload)
        try {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;
            
            // Check if it's a message
            if (value.messages && value.messages.length > 0) {
                const message = value.messages[0];
                const phoneNumber = message.from;
                
                if (message.type === 'text') {
                    const textBody = message.text.body;
                    console.log(`\n---> Received message from ${phoneNumber}: ${textBody}`);
                }
            }
        } catch (e) {
            // Payload didn't match expected structure, maybe it's a status update (delivered/read)
        }

        // You MUST return a 200 OK back to WhatsApp to acknowledge receipt
        res.status(200).send('EVENT_RECEIVED');
        
    } else {
        res.sendStatus(404);
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Webhook server is listening on port ${PORT}`);
});
