import 'dotenv/config';
import { Event, formatEventDate } from '@eventflow/shared';
import cors from 'cors';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/events', (_req, res) => {
    const events: Event[] = [
        {
            id: '1',
            name: 'Graduation',
            date: formatEventDate(new Date()),
            description: 'UJAP Engineers Graduation',
        },
    ];

    res.json(events);
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
