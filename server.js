require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

app.get("/", (req, res) => {
    res.send("WhatsApp Webhook Running");
});

app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];
    const challenge = req.query["hub.challenge"];
    const token = req.query["hub.verify_token"];

    if (
        mode === "subscribe" &&
        token === VERIFY_TOKEN
    ) {
        console.log("Webhook Verified");
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {

    try {

        const message =
            req.body.entry?.[0]
                ?.changes?.[0]
                ?.value?.messages?.[0];

        if (message) {

            const sender = message.from;
            const text = message.text?.body;

            console.log("Sender:", sender);
            console.log("Message:", text);

            await sendMessage(
                sender,
                `You said: ${text}`
            );
        }

        res.sendStatus(200);

    } catch (error) {

        console.error(error.response?.data || error);
        res.sendStatus(500);
    }
});

async function sendMessage(to, text) {

    await axios.post(
        `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: {
                body: text
            }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        }
    );
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
