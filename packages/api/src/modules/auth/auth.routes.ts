import { UserToLoginSchema } from '@eventflow/shared';
import { Router } from 'express';

import validateSchema from '../../infrastructure/http/validateSchema';

import AuthController from './auth.controller';

export default function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    router.post('/login', validateSchema(UserToLoginSchema), authController.login);

    return router;
}
