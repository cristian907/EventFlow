import { NextFunction, Request, Response } from 'express';

import { BusinessError } from '../../core/errors/BusinessErrors';
import { InternalServerError } from '../../core/errors/InternalServerErrors';
import { logger } from '../logger';

export default async function globalErrorHandler(
    error: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): Promise<void> {
    if (error instanceof BusinessError) {
        logger.error(error.message, { name: error.name, stack: error.stack });
        res.status(error.statusCode).json({
            name: error.name,
            message: error.message,
        });
    } else if (error instanceof InternalServerError) {
        logger.error(error.message, { name: error.name, stack: error.stack });
        res.status(error.statusCode).json({
            name: 'Internal Server Error',
            message: 'An error has ocurred on the server. Try again Later',
        });
    } else {
        logger.error(error.message, { name: error.name, stack: error.stack });
        res.status(500).json({
            name: 'Internal Server Error',
            message: 'An error has ocurred on the server. Try again Later',
        });
    }
}
