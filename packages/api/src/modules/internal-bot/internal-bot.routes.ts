import { Router } from 'express';

import internalApiKeyGuard from '../../infrastructure/http/internalApiKeyGuard';

import InternalBotController from './internal-bot.controller';

export default function createInternalBotRoutes(
    internalBotController: InternalBotController,
): Router {
    const router = Router();

    router.use(internalApiKeyGuard);

    router.get('/configs', internalBotController.getConfigs);

    return router;
}
