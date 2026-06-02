import { NextFunction, Request, Response } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import AccessService from './access.service';

export default class AccessController {
    constructor(private readonly accessService: AccessService) {}

    scan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const eventId = String(req.params.eventId);
            const result = await this.accessService.scanQr(eventId, req.body.qrData, store!.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const idNumber = String(req.query.idNumber || '').trim();
            if (!idNumber) {
                res.json({ customer: null, tickets: [] });
                return;
            }
            const result = await this.accessService.searchByIdNumber(eventId, idNumber);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    manualUse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const eventId = String(req.params.eventId);
            const ticketId = String(req.params.ticketId);
            const result = await this.accessService.manualUse(eventId, ticketId, store!.userId);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    logs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 50;
            const result = await this.accessService.getLogs(eventId, page, limit);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
