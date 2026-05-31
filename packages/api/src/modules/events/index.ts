import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';

import EventsController from './events.controller';
import createEventsRoutes from './events.routes';
import EventsService from './events.service';

export function createEventsModule(eventRepository: IEventRepository): Router {
    const eventsService = new EventsService(eventRepository);
    const eventsController = new EventsController(eventsService);
    const eventsRoutes = createEventsRoutes(eventsController);

    return eventsRoutes;
}
