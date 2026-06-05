import { Request, Response, NextFunction } from 'express';

import PublicEventsService from './public-events.service';

export default class PublicEventsController {
    constructor(private publicEventsService: PublicEventsService) {}

    getEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const event = await this.publicEventsService.getEvent(eventId);
            res.json({ event });
        } catch (error) {
            next(error);
        }
    };

    getTicketTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketTypes = await this.publicEventsService.getTicketTypes(eventId);
            res.json({ ticketTypes });
        } catch (error) {
            next(error);
        }
    };

    getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const eventId = String(req.params.eventId);
            const ticketTypeId = req.query.ticketTypeId
                ? String(req.query.ticketTypeId)
                : undefined;
            const availability = await this.publicEventsService.getAvailability(
                eventId,
                ticketTypeId,
            );
            res.json({ availability });
        } catch (error) {
            next(error);
        }
    };
}
