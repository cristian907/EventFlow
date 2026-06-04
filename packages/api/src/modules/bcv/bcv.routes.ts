import { Router } from 'express';

import authMiddleware, { authorizeAdmin } from '../../infrastructure/http/authMiddleware';

import BcvController from './bcv.controller';

export function createBcvRouter(bcvController: BcvController): Router {
    const router = Router();

    // Endpoints protect with authMiddleware. Read and manual sync available to authenticated users.
    router.use(authMiddleware);

    router.get('/', bcvController.getRate);
    router.post('/sync', authorizeAdmin, bcvController.syncRate);

    return router;
}
