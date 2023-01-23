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
    try {
        let res = await axios.get(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=True`);
        console.log(res.data);
        res = await axios.get(`${TELEGRAM_API}/setWebHook?url=${WEBHOOK_URL}`);
        console.log(res.data);
    } catch (oError) {
        console.log(oError);
    }
};

const send = async (sCommandType, sChatId, oData) => {
    const reply = Object.assign({
        chat_id: sChatId
    }, oData);
    await axios.post(`${TELEGRAM_API}/send${sCommandType}`, reply);
};

app.get("/", (req, res) => {
    res.send('Welcome to getFileBot!');
});

app.post(URI, async (req, res) => {
    if (!(req.body && req.body.message)) return res.send();

    const message = req.body.message,
        chatId = message.chat.id;

    if (message.entities && (message.entities[0].type === "url" || message.entities[0].type === "text_link")) {
        const {length, offset} = message.entities[0];
        const url = message.entities[0].type === "text_link" ? message.entities[0].url : message.text.substr(offset, length);

        try {
            axios.get(url);
            await send("Document", chatId, { document: url });
        } catch (e) {
            console.log(e);
            await send("Message", chatId, { text: "Unable to fetch file!" });
        }
    } else {
        await send("Message", chatId, { text: "Enter a valid URL!" });
    }

    res.send();
});

app.listen(process.env.PORT || 3001, async () => {
    console.log(`Server started on port ${process.env.PORT || 3001}`);
    await init();
});