import { Router } from 'express';

import ITransactionManager from '../../core/interfaces/ITransactionManager';
import IBcvRateRepository from '../../core/interfaces/repositories/IBcvRateRepository';
import ICustomerRepository from '../../core/interfaces/repositories/ICustomerRepository';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import IOrderRepository from '../../core/interfaces/repositories/IOrderRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';
import TicketsService from '../tickets/tickets.service';

import SalesController from './sales.controller';
import createSalesRoutes from './sales.routes';
import SalesService from './sales.service';

export function createSalesModule(
    txManager: ITransactionManager,
    orderRepository: IOrderRepository,
    customerRepository: ICustomerRepository,
    ticketTypeRepository: ITicketTypeRepository,
    exchangeRateRepository: IExchangeRateRepository,
    ticketsService: TicketsService,
    bcvRateRepository: IBcvRateRepository,
    eventRepository: IEventRepository,
): Router {
    const salesService = new SalesService(
        txManager,
        orderRepository,
        customerRepository,
        ticketTypeRepository,
        exchangeRateRepository,
        ticketsService,
        bcvRateRepository,
        eventRepository,
    );
    const salesController = new SalesController(salesService);
    return createSalesRoutes(salesController);
}
