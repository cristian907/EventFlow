import winston from 'winston';

import { ILogger } from '../core/interfaces/ILogger';

const isProd = process.env.NODE_ENV === 'production';

const appendNewline = winston.format((info) => {
    info.message = `${info.message}\n`;
    return info;
});

const logger: ILogger = winston.createLogger({
    level: isProd ? 'info' : 'debug',
    format: isProd
        ? winston.format.combine(appendNewline(), winston.format.json())
        : winston.format.combine(
              appendNewline(),
              winston.format.colorize(),
              winston.format.simple(),
          ),
    transports: [new winston.transports.Console()],
});

export { logger };
