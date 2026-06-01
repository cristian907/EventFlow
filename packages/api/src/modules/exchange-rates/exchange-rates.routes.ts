import { ExchangeRateToCreateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import ExchangeRatesController from './exchange-rates.controller';

export default function createExchangeRatesRoutes(
    exchangeRatesController: ExchangeRatesController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware, authorizeEventRole('admin'));

    router.post('/', validateSchema(ExchangeRateToCreateSchema), exchangeRatesController.create);
    router.get('/current', exchangeRatesController.getCurrent);
    router.get('/', exchangeRatesController.list);

    return router;
}
