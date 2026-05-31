import { EventToCreateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeAdmin } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import EventsController from './events.controller';

export default function createEventsRoutes(eventsController: EventsController): Router {
    const router = Router();

    // List events: accessible to any authenticated user (their own if USER, all if ADMIN)
    router.get('/', authMiddleware, eventsController.list);

    // Create event: ADMIN global role only
    router.post(
        '/',
        authMiddleware,
        authorizeAdmin,
        validateSchema(EventToCreateSchema),
        eventsController.create,
    );

    // Get event detail: authenticated user must be a member of the event (or ADMIN global)
    // Note: detail endpoint checks membership inside the service, so we use authMiddleware
    router.get('/:eventId', authMiddleware, eventsController.getDetail);

    return router;
}
