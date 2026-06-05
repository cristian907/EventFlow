import { BotConfigToUpsertSchema, BotConfigTestSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import BotConfigController from './bot-config.controller';

export default function createBotConfigRoutes(botConfigController: BotConfigController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin'));

    router.get('/', botConfigController.get);
    router.put('/', validateSchema(BotConfigToUpsertSchema), botConfigController.upsert);
    router.post('/test', validateSchema(BotConfigTestSchema), botConfigController.test);

    return router;
}
