import { UserToLoginSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import AuthController from './auth.controller';

export default function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    router.post('/login', validateSchema(UserToLoginSchema), authController.login);
    router.get('/me', authMiddleware, authController.me);
    router.post('/logout', authMiddleware, authController.logout);
    router.put('/theme', authMiddleware, authController.updateTheme);

    return router;
}
