import { TicketTypeToCreateSchema, TicketTypeToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import TicketTypesController from './ticket-types.controller';

export default function createTicketTypesRoutes(
    ticketTypesController: TicketTypesController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware);

    // GET /events/:eventId/ticket-types
    router.get('/', authorizeEventRole('admin', 'collaborator'), ticketTypesController.list);

    // POST /events/:eventId/ticket-types
    router.post(
        '/',
        authorizeEventRole('admin'),
        validateSchema(TicketTypeToCreateSchema),
        ticketTypesController.create,
    );

    // GET /events/:eventId/ticket-types/:ticketTypeId
    router.get(
        '/:ticketTypeId',
        authorizeEventRole('admin', 'collaborator'),
        ticketTypesController.getById,
    );

    // PUT /events/:eventId/ticket-types/:ticketTypeId
    router.put(
        '/:ticketTypeId',
        authorizeEventRole('admin'),
        validateSchema(TicketTypeToUpdateSchema),
        ticketTypesController.update,
    );

    // DELETE /events/:eventId/ticket-types/:ticketTypeId (soft delete)
    router.delete('/:ticketTypeId', authorizeEventRole('admin'), ticketTypesController.deactivate);

    return router;
}
