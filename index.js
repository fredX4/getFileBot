require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const {TOKEN, SERVER_URL} = process.env;
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;
const app = express();
app.use(bodyParser.json());

const init = async () => {
    let res = await axios.get(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=True`);
    console.log(res.data);
    res = await axios.get(`${TELEGRAM_API}/setWebHook?url=${WEBHOOK_URL}`);
    console.log(res.data);
};

app.get("/", (req, res) => {
    res.send('Welcome to getFileBot!');
});

app.post(URI, async (req, res) => {
    if (!(req.body && req.body.message)) return res.send();

    const message = req.body.message,
        link = message.text.includes("http") ? message.text : "";

    if (link) {
        const reply = {
            chat_id: message.chat.id,
            document: link
        };
        try {
            await axios.post(`${TELEGRAM_API}/sendDocument`, reply);
        } catch (e) {
            console.log(e);
            const reply = {
                chat_id: message.chat.id,
                text: "Unable to fetch file!"
            };
            await axios.post(`${TELEGRAM_API}/sendMessage`, reply);
        }
    } else {
        const reply = {
            chat_id: message.chat.id,
            text: "Enter a valid URL!"
        };
        await axios.post(`${TELEGRAM_API}/sendMessage`, reply);
    }

    res.send();
});

app.listen(process.env.PORT || 3000, async () => {
    console.log(`Server started on port ${process.env.PORT || 3000}`);
    await init();
});