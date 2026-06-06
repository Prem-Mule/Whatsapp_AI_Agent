const express = require("express");
const app = express();

app.use(express.json());

// webhook verify (Meta calls this once)
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// incoming messages
app.post("/webhook", (req, res) => {
    console.log("Webhook hit:", JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

app.listen(3000, () => console.log("Running"));