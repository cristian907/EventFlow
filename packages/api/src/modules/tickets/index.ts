import { Router } from 'express';

import ITicketRepository from '../../core/interfaces/repositories/ITicketRepository';

import TicketCryptoService from './ticket-crypto.service';
import TicketsController from './tickets.controller';
import createTicketsRoutes from './tickets.routes';
import TicketsService from './tickets.service';

export function createTicketsModule(
    ticketRepository: ITicketRepository,
    qrSecret: string,
): { router: Router; ticketsService: TicketsService } {
    const cryptoService = new TicketCryptoService(qrSecret);
    const ticketsService = new TicketsService(ticketRepository, cryptoService);
    const ticketsController = new TicketsController(ticketsService);
    const router = createTicketsRoutes(ticketsController);
    return { router, ticketsService };
}
