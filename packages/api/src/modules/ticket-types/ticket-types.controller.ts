import { Request, Response, NextFunction } from 'express';

import TicketTypesService from './ticket-types.service';

export default class TicketTypesController {
    constructor(private ticketTypesService: TicketTypesService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketType = await this.ticketTypesService.create(eventId, req.body);
            res.status(201).json({ ticketType });
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const includeInactive = req.query.includeInactive !== 'false';
            const result = await this.ticketTypesService.list(eventId, includeInactive);
            res.json(result);
        } catch (error) {
            next(error);
        }
    };

    getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketTypeId = String(req.params.ticketTypeId);
            const ticketType = await this.ticketTypesService.getById(eventId, ticketTypeId);
            res.json({ ticketType });
        } catch (error) {
            next(error);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketTypeId = String(req.params.ticketTypeId);
            const ticketType = await this.ticketTypesService.update(
                eventId,
                ticketTypeId,
                req.body,
            );
            res.json({ ticketType });
        } catch (error) {
            next(error);
        }
    };

    deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketTypeId = String(req.params.ticketTypeId);
            const ticketType = await this.ticketTypesService.deactivate(eventId, ticketTypeId);
            res.json({ ticketType });
        } catch (error) {
            next(error);
        }
    };
}
