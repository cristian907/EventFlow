import { Request, Response, NextFunction } from 'express';

import { BusinessError } from '../../core/errors/BusinessErrors';
import { InternalServerError } from '../../core/errors/InternalServerErrors';

export default function globalErrorHandler(
    error: Error,
    _req: Request,
    res: Response,
    _next: NextFunction,
): void {
    if (error instanceof BusinessError) {
        console.error(error);
        res.status(error.statusCode).json({
            name: error.name,
            message: error.message,
        });
    } else if (error instanceof InternalServerError) {
        console.error(error);
        res.status(error.statusCode).json({
            name: 'Internal Server Error',
            message: 'An error has ocurred on the server. Try again Later',
        });
    } else {
        console.error(error);
        res.status(500).json({
            name: 'Internal Server Error',
            message: 'An error has ocurred on the server. Try again Later',
        });
    }
}
