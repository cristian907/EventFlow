import crypto from 'node:crypto';

import { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../../core/errors/BusinessErrors';
import { EnvironmentVariableError } from '../../core/errors/InternalServerErrors';

export default function internalApiKeyGuard(
    req: Request,
    _res: Response,
    next: NextFunction,
): void {
    const expected = process.env.INTERNAL_API_KEY;
    if (!expected) return next(new EnvironmentVariableError('INTERNAL_API_KEY'));

    const header = req.header('x-internal-api-key');
    if (!header) return next(new UnauthorizedError());

    // we use Buffer in order to prevent timing attacks (crypto.timingSafeEqual) instead of a simple string comparison
    // because if we don't use this, an attacker could measure the time it takes to compare the strings and guess the key character by character.
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(header);
    if (
        expectedBuf.length !== providedBuf.length ||
        !crypto.timingSafeEqual(expectedBuf, providedBuf)
    ) {
        return next(new UnauthorizedError());
    }

    next();
}
