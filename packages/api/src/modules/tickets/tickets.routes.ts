import { TicketVerifySchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import TicketsController from './tickets.controller';

export default function createTicketsRoutes(ticketsController: TicketsController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin', 'collaborator'));

    router.get('/orders/:orderId/tickets', ticketsController.listByOrder);
    router.get('/tickets/:ticketId/download', ticketsController.download);
    router.post('/tickets/verify', validateSchema(TicketVerifySchema), ticketsController.verify);

    return router;
}
