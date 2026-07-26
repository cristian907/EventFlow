import { Router } from 'express';

import IUserRepository from '../../core/interfaces/repositories/IUserRepository';

import AuthController from './auth.controller';
import createAuthRoutes from './auth.routes';
import AuthService from './auth.service';

export function createAuthModule(userRepository: IUserRepository): Router {
    const authService = new AuthService(userRepository);
    const authController = new AuthController(authService);
    const authRoutes = createAuthRoutes(authController);

    return authRoutes;
}
