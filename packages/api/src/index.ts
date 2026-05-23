import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { modules } from './infrastructure/container';
import globalErrorHandler from './infrastructure/http/globalErrorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(express.json());
app.use(cookieParser());

for (const [path, router] of Object.entries(modules)) {
    app.use(`/api/${path}`, router);
}

app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});
