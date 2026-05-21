import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

export default function validateSchema(
    schema: ZodObject,
): (req: Request, res: Response, next: NextFunction) => void {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                console.log('Validation Error Details:', JSON.stringify(error.issues, null, 2));
                return res.status(400).json({
                    message: error.issues
                        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
                        .join(', '),
                    detailsOfEachInvalidData: error.issues.map((issue) => {
                        return {
                            code: issue.code,
                            message: issue.message,
                            path: issue.path,
                        };
                    }),
                });
            }
            next(error);
        }
    };
}
