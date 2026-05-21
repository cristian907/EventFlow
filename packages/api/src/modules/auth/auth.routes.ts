import { Router } from 'express';

import AuthController from './auth.controller';

export default function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    router.post('/login', authController.login);

    return router;
}
