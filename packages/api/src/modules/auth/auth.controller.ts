import { Request, Response, NextFunction } from 'express';

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
}
