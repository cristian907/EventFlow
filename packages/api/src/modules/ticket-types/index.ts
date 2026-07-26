import { Router } from 'express';

import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import TicketTypesController from './ticket-types.controller';
import createTicketTypesRoutes from './ticket-types.routes';
import TicketTypesService from './ticket-types.service';

export function createTicketTypesModule(
    ticketTypeRepository: ITicketTypeRepository,
    eventRepository: IEventRepository,
    exchangeRateRepository: IExchangeRateRepository,
): Router {
    const ticketTypesService = new TicketTypesService(
        ticketTypeRepository,
        eventRepository,
        exchangeRateRepository,
    );
    const ticketTypesController = new TicketTypesController(ticketTypesService);
    const ticketTypesRoutes = createTicketTypesRoutes(ticketTypesController);

    return ticketTypesRoutes;
}
