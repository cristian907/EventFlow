import { Request, Response, NextFunction } from 'express';

import PaymentMethodsService from './payment-methods.service';

export default class PaymentMethodsController {
    constructor(private paymentMethodsService: PaymentMethodsService) {}

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const methods = await this.paymentMethodsService.list(eventId);
            res.json({ paymentMethods: methods });
        } catch (error) {
            next(error);
        }
    };

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const created = await this.paymentMethodsService.create(eventId, req.body);
            res.status(201).json({ paymentMethod: created });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const methodId = String(req.params.methodId);
            const updated = await this.paymentMethodsService.update(eventId, methodId, req.body);
            res.json({ paymentMethod: updated });
        } catch (error) {
            next(error);
        }
    };

    disable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const methodId = String(req.params.methodId);
            const disabled = await this.paymentMethodsService.disable(eventId, methodId);
            res.json({ paymentMethod: disabled });
        } catch (error) {
            next(error);
        }
    };
}
