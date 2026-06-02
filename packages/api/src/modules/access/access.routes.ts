import { AccessScanSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import AccessController from './access.controller';

export default function createAccessRoutes(accessController: AccessController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin', 'scanner'));

    router.post('/scan', validateSchema(AccessScanSchema), accessController.scan);

    router.get('/search', accessController.search);

    router.post('/tickets/:ticketId/use', accessController.manualUse);

    router.get('/logs', accessController.logs);

    return router;
}
