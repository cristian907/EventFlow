import { ExchangeRateToCreateSchema } from '@eventflow/shared';
import { Router } from 'express';

import authMiddleware, { authorizeEventRole } from '../../infrastructure/http/authMiddleware';
import validateSchema from '../../infrastructure/http/validateSchema';

import ExchangeRatesController from './exchange-rates.controller';

export default function createExchangeRatesRoutes(
    exchangeRatesController: ExchangeRatesController,
): Router {
    const router = Router({ mergeParams: true });

    router.use(authMiddleware);

    router.post(
        '/',
        authorizeEventRole('admin'),
        validateSchema(ExchangeRateToCreateSchema),
        exchangeRatesController.create,
    );
    router.get(
        '/current',
        authorizeEventRole('admin', 'collaborator', 'scanner'),
        exchangeRatesController.getCurrent,
    );
    router.get(
        '/',
        authorizeEventRole('admin', 'collaborator', 'scanner'),
        exchangeRatesController.list,
    );

    return router;
}
