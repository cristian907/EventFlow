import { PaymentMethodToCreateSchema, PaymentMethodToUpdateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import PaymentMethodsController from './payment-methods.controller';

export default function createPaymentMethodsRoutes(
    paymentMethodsController: PaymentMethodsController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin'));

    router.get('/', paymentMethodsController.list);
    router.post('/', validateSchema(PaymentMethodToCreateSchema), paymentMethodsController.create);
    router.put(
        '/:methodId',
        validateSchema(PaymentMethodToUpdateSchema),
        paymentMethodsController.update,
    );
    router.delete('/:methodId', paymentMethodsController.disable);

    return router;
}
