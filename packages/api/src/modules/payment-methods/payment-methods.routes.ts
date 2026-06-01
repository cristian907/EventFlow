import { PaymentMethodToCreateSchema, PaymentMethodToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import PaymentMethodsController from './payment-methods.controller';

export default function createPaymentMethodsRoutes(
    paymentMethodsController: PaymentMethodsController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware);

    router.get('/', authorizeEventRole('admin', 'collaborator'), paymentMethodsController.list);
    router.post(
        '/',
        authorizeEventRole('admin'),
        validateSchema(PaymentMethodToCreateSchema),
        paymentMethodsController.create,
    );
    router.put(
        '/:methodId',
        authorizeEventRole('admin'),
        validateSchema(PaymentMethodToUpdateSchema),
        paymentMethodsController.update,
    );
    router.delete('/:methodId', authorizeEventRole('admin'), paymentMethodsController.disable);

    return router;
}
