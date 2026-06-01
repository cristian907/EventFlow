import { Request, Response, NextFunction } from 'express';
import { ZodType, ZodError, ZodIssue } from 'zod';

export default function validateSchema(
    schema: ZodType<unknown>,
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
                        .map((issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
                        .join(', '),
                    detailsOfEachInvalidData: error.issues.map((issue: ZodIssue) => {
                        return {
                            code: issue.code,
                            message: issue.message,
                            path: issue.path,
                        };
                    }),
                });
            }
            next(error instanceof Error ? error : new Error(String(error)));
        }
    };
}
