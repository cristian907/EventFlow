import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import EventsController from './events.controller';
import createEventsRoutes from './events.routes';
import EventsService from './events.service';

export function createEventsModule(
    eventRepository: IEventRepository,
    ticketTypeRepository: ITicketTypeRepository,
): Router {
    const eventsService = new EventsService(eventRepository, ticketTypeRepository);
    const eventsController = new EventsController(eventsService);
    const eventsRoutes = createEventsRoutes(eventsController);

    return eventsRoutes;
}
