import { Request, Response, NextFunction } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import SalesService from './sales.service';

export default class SalesController {
    constructor(private readonly salesService: SalesService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            if (!store?.userId) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }
            const eventId = String(req.params.eventId);
            const order = await this.salesService.createSale(eventId, store.userId, req.body);
            res.status(201).json({ order });
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 20;
            const idNumber = req.query.idNumber ? String(req.query.idNumber) : undefined;
            const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
            const endDate = req.query.endDate ? String(req.query.endDate) : undefined;
            const ticketTypeId = req.query.ticketTypeId
                ? String(req.query.ticketTypeId)
                : undefined;

            const result = await this.salesService.listOrders(eventId, {
                page,
                limit,
                idNumber,
                startDate,
                endDate,
                ticketTypeId,
            });
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const orderId = String(req.params.orderId);
            const order = await this.salesService.getOrderDetail(eventId, orderId);
            res.json({ order });
        } catch (error) {
            next(error);
        }
    };
}
