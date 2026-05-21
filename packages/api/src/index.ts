import 'dotenv/config';
import cors from 'cors';
import express from 'express';

import { modules } from './infrastructure/container';
import globalErrorHandler from './infrastructure/http/globalErrorHandler';

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

for (const [path, router] of Object.entries(modules)) {
    app.use(`/api/${path}`, router);
}

app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
