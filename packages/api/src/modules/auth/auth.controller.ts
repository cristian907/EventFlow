import { Request, Response, NextFunction } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import AuthService from './auth.service';

export default class AuthController {
    constructor(private authService: AuthService) {}

    login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = await this.authService.login(req.body);
            const token = this.authService.getJWT(user.id, user.role);

            res.cookie('access_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: this.authService.jwtExpiresInMs,
            }).json({ user });
        } catch (error) {
            next(error);
        }
    };

    me = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            if (!store) {
                res.status(401).json({ message: 'No hay una sesión autenticada.' });
                return;
            }
            const user = await this.authService.getCurrentUser(store.userId);
            res.json({ user });
        } catch (error) {
            next(error);
        }
    };

    logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            res.clearCookie('access_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
            }).json({ message: 'Logged out successfully' });
        } catch (error) {
            next(error);
        }
    };

    updateTheme = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            if (!store) {
                res.status(401).json({ message: 'No hay una sesión autenticada.' });
                return;
            }
            const { theme } = req.body;
            if (!theme || !['light', 'dark', 'system'].includes(theme)) {
                res.status(400).json({ message: 'El tema provisto no es válido.' });
                return;
            }
            const user = await this.authService.updateUserTheme(store.userId, theme);
            res.json({ user });
        } catch (error) {
            next(error);
        }
    };
}
