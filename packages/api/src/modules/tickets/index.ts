import { Router } from 'express';

import ITicketRepository from '../../core/interfaces/repositories/ITicketRepository';

import TicketCryptoService from './ticket-crypto.service';
import TicketsController from './tickets.controller';
import createTicketsRoutes from './tickets.routes';
import TicketsService from './tickets.service';

export { TicketCryptoService };

export function createTicketsModule(
    ticketRepository: ITicketRepository,
    cryptoService: TicketCryptoService,
): { router: Router; ticketsService: TicketsService } {
    const ticketsService = new TicketsService(ticketRepository, cryptoService);
    const ticketsController = new TicketsController(ticketsService);
    const router = createTicketsRoutes(ticketsController);
    return { router, ticketsService };
}
