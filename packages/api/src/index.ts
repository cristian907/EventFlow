import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import { modules } from './infrastructure/container';
import globalErrorHandler from './infrastructure/http/globalErrorHandler';
import { logger } from './infrastructure/logger';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    logger: {
        warn: (error: unknown, message?: string) =>
            logger.warn(message ?? String(error), { error }),
        error: (error: unknown, message?: string) =>
            logger.error(message ?? String(error), { error }),
    },
});

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
    }),
);
app.use(limiter);
app.use(helmet());
app.use(morgan('tiny'));
app.use(express.json());
app.use(cookieParser());

for (const [path, router] of Object.entries(modules)) {
    app.use(`/api/${path}`, router);
}

app.use(globalErrorHandler);

app.listen(PORT, () => {
    logger.info(`API server running on http://localhost:${PORT}`);
});
