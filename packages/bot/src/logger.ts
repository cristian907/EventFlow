import winston from 'winston';

import { config } from './config';

const isProd = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
    level: config.logLevel,
    format: isProd
        ? winston.format.combine(winston.format.timestamp(), winston.format.json())
        : winston.format.combine(winston.format.colorize(), winston.format.simple()),
    transports: [new winston.transports.Console()],
});
