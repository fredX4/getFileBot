import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

dotenv.config();

const { TOKEN, SERVER_URL } = process.env;
if (!TOKEN || !SERVER_URL) {
    throw new Error('Missing environment variables: TOKEN or SERVER_URL');
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/webhook/${TOKEN}`;
const WEBHOOK_URL = SERVER_URL + URI;

const app = express();
app.use(bodyParser.json());

const initWebhook = async (): Promise<void> => {
    try {
        await axios.get(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=True`);
        console.log('webhook deleted');

        await axios.get(`${TELEGRAM_API}/setWebHook?url=${WEBHOOK_URL}`);
        console.log('webhook set');
    } catch (error) {
        console.error('Webhook init error:', (error as Error).message);
    }
};

const sendTelegram = async (
    commandType: string,
    chatId: number,
    data: Record<string, any>
): Promise<void> => {
    const payload = { chat_id: chatId, ...data };
    await axios.post(`${TELEGRAM_API}/send${commandType}`, payload);
};

app.get('/', (_req: Request, res: Response) => {
    res.send('Welcome to getFileBot!');
});

app.post(URI, async (req: Request, res: Response): Promise<void> => {
    const message = req.body?.message;
    if (!message) {
        res.send();
        return;
    }
    const chatId: number = message.chat.id;
    const entity = message.entities?.[0];
    if (entity && (entity.type === 'url' || entity.type === 'text_link')) {
        const { length, offset } = entity;
        const url = entity.type === 'text_link' ? entity.url : message.text.substr(offset, length);
        try {
            await axios.get(url);
            await sendTelegram('Document', chatId, { document: url });
        } catch (error) {
            console.error('File fetch error:', error);
            await sendTelegram('Message', chatId, { text: 'Unable to fetch file!' });
        }
    } else {
        await sendTelegram('Message', chatId, { text: 'Enter a valid URL!' });
    }
    res.send();
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(PORT, async () => {
    console.log(`Server started on port ${PORT}`);
    await initWebhook();
});
