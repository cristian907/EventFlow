import { AsyncLocalStorage } from 'node:async_hooks';

import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
const { verify } = jwt;

import { UserRole } from '../../core/entities/User';
import { UnauthorizedError } from '../../core/errors/BusinessErrors';
import { EnvironmentVariableError } from '../../core/errors/InternalServerErrors';

export interface RequestContext {
    userId: string;
    role: UserRole;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export default function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return next(new EnvironmentVariableError('JWT_SECRET'));

    const token: string | undefined = req.cookies['access_token'];
    if (!token) return next(new UnauthorizedError());

    let payload: JwtPayload;
    try {
        payload = verify(token, jwtSecret) as JwtPayload;
    } catch {
        return next(new UnauthorizedError());
    }

    const { userId, role } = payload;
    if (!userId || !role) return next(new UnauthorizedError());

    requestContext.run({ userId, role }, () => next());
}

export function authorizeAdmin(_req: Request, _res: Response, next: NextFunction): void {
    const store = requestContext.getStore();
    if (!store || store.role !== UserRole.Admin) return next(new UnauthorizedError());
    next();
}
