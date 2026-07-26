import { Router } from 'express';

import internalApiKeyGuard from '../../infrastructure/http/internalApiKeyGuard';

import PublicEventsController from './public-events.controller';

export default function createPublicEventsRoutes(
    publicEventsController: PublicEventsController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(internalApiKeyGuard);

    router.get('/', publicEventsController.getEvent);
    router.get('/ticket-types', publicEventsController.getTicketTypes);
    router.get('/availability', publicEventsController.getAvailability);

    return router;
}
