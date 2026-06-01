import { TicketTypeToCreateSchema, TicketTypeToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import TicketTypesController from './ticket-types.controller';

export default function createTicketTypesRoutes(
    ticketTypesController: TicketTypesController,
): Router {
    const router = Router({ mergeParams: true });

    // All routes require authentication + event admin role
    router.use(authMiddleware, authorizeEventRole('admin'));

    // GET /events/:eventId/ticket-types
    router.get('/', ticketTypesController.list);

    // POST /events/:eventId/ticket-types
    router.post('/', validateSchema(TicketTypeToCreateSchema), ticketTypesController.create);

    // GET /events/:eventId/ticket-types/:ticketTypeId
    router.get('/:ticketTypeId', ticketTypesController.getById);

    // PUT /events/:eventId/ticket-types/:ticketTypeId
    router.put(
        '/:ticketTypeId',
        validateSchema(TicketTypeToUpdateSchema),
        ticketTypesController.update,
    );

    // DELETE /events/:eventId/ticket-types/:ticketTypeId (soft delete)
    router.delete('/:ticketTypeId', ticketTypesController.deactivate);

    return router;
}
