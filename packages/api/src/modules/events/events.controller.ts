import { EventStatus } from '@eventflow/shared';
import { Request, Response, NextFunction } from 'express';

import { requestContext } from '../../infrastructure/http/authMiddleware';

import EventsService from './events.service';

export default class EventsController {
    constructor(private eventsService: EventsService) {}

    create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const organizerId = store?.userId;

            if (!organizerId) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }

            const event = await this.eventsService.createEvent(organizerId, req.body);
            res.status(201).json({ event });
        } catch (error) {
            next(error);
        }
    };

    list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const userId = store?.userId;
            const userRole = store?.role;

            if (!userId || !userRole) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }

            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;
            const search = req.query.search ? String(req.query.search) : undefined;
            const status = req.query.status ? (String(req.query.status) as EventStatus) : undefined;

            const result = await this.eventsService.listEvents({
                page,
                limit,
                search,
                status,
                userId,
                userRole,
            });

            res.json({
                events: result.events,
                total: result.total,
                page,
                limit,
                totalPages: result.totalPages,
            });
        } catch (error) {
            next(error);
        }
    };

    getDetail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const store = requestContext.getStore();
            const userId = store?.userId;
            const userRole = store?.role;

            if (!userId || !userRole) {
                res.status(401).json({ message: 'No autenticado' });
                return;
            }

            const eventId = String(req.params.eventId);
            const result = await this.eventsService.getEventDetail(eventId, userId, userRole);

            res.json(result);
        } catch (error) {
            next(error);
        }
    };
}
