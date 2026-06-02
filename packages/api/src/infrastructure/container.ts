import { EnvironmentVariableError } from '../core/errors/InternalServerErrors';
import prisma from '../infrastructure/database/PrismaClient';
import { createAccessModule } from '../modules/access';
import { createAuthModule } from '../modules/auth';
import { createEventsModule } from '../modules/events';
import { createExchangeRatesModule } from '../modules/exchange-rates';
import { createPaymentMethodsModule } from '../modules/payment-methods';
import { createSalesModule } from '../modules/sales';
import { createStaffModule } from '../modules/staff';
import { createTicketTypesModule } from '../modules/ticket-types';
import { createTicketsModule, TicketCryptoService } from '../modules/tickets';
import { createUsersModule } from '../modules/users';

import PrismaTransactionManager from './PrismaTransactionManager';
import PrismaAccessLogRepository from './repositories/PrismaAccessLogRepository';
import PrismaCustomerRepository from './repositories/PrismaCustomerRepository';
import PrismaEventMemberRepository from './repositories/PrismaEventMemberRepository';
import PrismaEventRepository from './repositories/PrismaEventRepository';
import PrismaExchangeRateRepository from './repositories/PrismaExchangeRateRepository';
import PrismaOrderRepository from './repositories/PrismaOrderRepository';
import PrismaPaymentMethodRepository from './repositories/PrismaPaymentMethodRepository';
import PrismaTicketRepository from './repositories/PrismaTicketRepository';
import PrismaTicketTypeRepository from './repositories/PrismaTicketTypeRepository';
import PrismaUserRepository from './repositories/PrismaUserRepository';

export const repositories = {
    user: new PrismaUserRepository(prisma),
    event: new PrismaEventRepository(prisma),
    ticketType: new PrismaTicketTypeRepository(prisma),
    eventMember: new PrismaEventMemberRepository(prisma),
    paymentMethod: new PrismaPaymentMethodRepository(prisma),
    exchangeRate: new PrismaExchangeRateRepository(prisma),
    customer: new PrismaCustomerRepository(prisma),
    order: new PrismaOrderRepository(prisma),
    ticket: new PrismaTicketRepository(prisma),
    accessLog: new PrismaAccessLogRepository(prisma),
};

const txManager = new PrismaTransactionManager(prisma);

const ticketQrSecret = process.env.TICKET_QR_SECRET;
if (!ticketQrSecret) {
    throw new EnvironmentVariableError('TICKET_QR_SECRET');
}

const cryptoService = new TicketCryptoService(ticketQrSecret);

const { router: ticketsRouter, ticketsService } = createTicketsModule(
    repositories.ticket,
    cryptoService,
);

export const modules = {
    auth: createAuthModule(repositories.user),
    users: createUsersModule(repositories.user),
    events: createEventsModule(repositories.event, repositories.ticketType),
    'events/:eventId/ticket-types': createTicketTypesModule(
        repositories.ticketType,
        repositories.event,
    ),
    'events/:eventId/staff': createStaffModule(
        repositories.eventMember,
        repositories.user,
        repositories.event,
    ),
    'events/:eventId/payment-methods': createPaymentMethodsModule(
        repositories.paymentMethod,
        repositories.event,
    ),
    'events/:eventId/exchange-rates': createExchangeRatesModule(
        repositories.exchangeRate,
        repositories.event,
    ),
    'events/:eventId/sales': createSalesModule(
        txManager,
        repositories.order,
        repositories.customer,
        repositories.ticketType,
        repositories.exchangeRate,
        ticketsService,
    ),
    'events/:eventId': ticketsRouter,
    'events/:eventId/access': createAccessModule(
        repositories.ticket,
        repositories.accessLog,
        cryptoService,
    ),
};
