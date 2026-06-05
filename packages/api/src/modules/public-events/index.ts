import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import PublicEventsController from './public-events.controller';
import createPublicEventsRoutes from './public-events.routes';
import PublicEventsService from './public-events.service';

export function createPublicEventsModule(
    eventRepository: IEventRepository,
    ticketTypeRepository: ITicketTypeRepository,
): Router {
    const publicEventsService = new PublicEventsService(eventRepository, ticketTypeRepository);
    const publicEventsController = new PublicEventsController(publicEventsService);
    return createPublicEventsRoutes(publicEventsController);
}
