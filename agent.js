const axios = require("axios");
const { sendMessage } = require("./whatsapp");

async function handleIncomingMessage(userId, message) {

    // 1. Ask AI to understand message
    const aiResponse = await analyze(message);

    // 2. Decide next action
    if (aiResponse.intent === "buy_property") {

        if (!aiResponse.budget) {
            return sendMessage(userId, "What is your budget range?");
        }

        if (!aiResponse.location) {
            return sendMessage(userId, "Which location are you looking in?");
        }

        return sendMessage(userId, "Got it. I’ll find matching properties for you.");
    }

    return sendMessage(userId, "Can you explain your requirement?");
}

async function analyze(message) {

    const prompt = `
Extract structured data:

Message: ${message}

Return JSON:
{
  "intent": "",
  "budget": "",
  "location": "",
  "urgency": ""
}
`;

    const res = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }]
    }, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_KEY}`
        }
    });

    return JSON.parse(res.data.choices[0].message.content);
}

module.exports = { handleIncomingMessage };