import { SaleToCreateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import SalesController from './sales.controller';

export default function createSalesRoutes(salesController: SalesController): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin', 'collaborator'));

    router.post('/', validateSchema(SaleToCreateSchema), salesController.create);
    router.get('/', salesController.list);
    router.get('/:orderId', salesController.getDetail);

    return router;
}
