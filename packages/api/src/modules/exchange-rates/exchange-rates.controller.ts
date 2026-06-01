import { Request, Response, NextFunction } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import ExchangeRatesService from './exchange-rates.service';

export default class ExchangeRatesController {
    constructor(private exchangeRatesService: ExchangeRatesService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const setBy = store?.userId;
            if (!setBy) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }

            const eventId = String(req.params.eventId);
            const created = await this.exchangeRatesService.create(eventId, req.body, setBy);
            res.status(201).json({ exchangeRate: created });
        } catch (error) {
            next(error);
        }
    };

    getCurrent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const current = await this.exchangeRatesService.getCurrent(eventId);
            res.json({ current });
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const rates = await this.exchangeRatesService.list(eventId);
            res.json({ exchangeRates: rates });
        } catch (error) {
            next(error);
        }
    };
}
