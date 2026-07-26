import { EventToCreateSchema, EventToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, {
    authorizeAdmin,
    authorizeEventRole,
} from '../../infrastructure/http/authMiddleware';
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
    router.get('/:eventId', authMiddleware, eventsController.getDetail);

    // Update event general config: event admin only
    router.put(
        '/:eventId',
        authMiddleware,
        authorizeEventRole('admin'),
        validateSchema(EventToUpdateSchema),
        eventsController.update,
    );

    return router;
}
