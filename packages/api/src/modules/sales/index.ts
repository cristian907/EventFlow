import { Router } from 'express';

import ITransactionManager from '../../core/interfaces/ITransactionManager';
import ICustomerRepository from '../../core/interfaces/repositories/ICustomerRepository';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import IOrderRepository from '../../core/interfaces/repositories/IOrderRepository';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';

import SalesController from './sales.controller';
import createSalesRoutes from './sales.routes';
import SalesService from './sales.service';

export function createSalesModule(
    txManager: ITransactionManager,
    orderRepository: IOrderRepository,
    customerRepository: ICustomerRepository,
    ticketTypeRepository: ITicketTypeRepository,
    exchangeRateRepository: IExchangeRateRepository,
): Router {
    const salesService = new SalesService(
        txManager,
        orderRepository,
        customerRepository,
        ticketTypeRepository,
        exchangeRateRepository,
    );
    const salesController = new SalesController(salesService);
    return createSalesRoutes(salesController);
}
