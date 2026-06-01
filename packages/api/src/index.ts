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

const server = app.listen(PORT, () => {
    logger.info(`API server running on http://localhost:${PORT}`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Exiting...`);
        process.exit(1);
    } else {
        logger.error('Server error', { err });
        throw err;
    }
});

const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}. Closing server...`);
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
