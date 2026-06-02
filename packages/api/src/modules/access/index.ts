import { Router } from 'express';

import IAccessLogRepository from '../../core/interfaces/repositories/IAccessLogRepository';
import ITicketRepository from '../../core/interfaces/repositories/ITicketRepository';
import TicketCryptoService from '../tickets/ticket-crypto.service';

import AccessController from './access.controller';
import createAccessRoutes from './access.routes';
import AccessService from './access.service';

export function createAccessModule(
    ticketRepository: ITicketRepository,
    accessLogRepository: IAccessLogRepository,
    cryptoService: TicketCryptoService,
): Router {
    const accessService = new AccessService(ticketRepository, accessLogRepository, cryptoService);
    const accessController = new AccessController(accessService);
    return createAccessRoutes(accessController);
}
