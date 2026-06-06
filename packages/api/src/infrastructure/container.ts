import { EnvironmentVariableError } from '../core/errors/InternalServerErrors';
import prisma from '../infrastructure/database/PrismaClient';
import { createAccessModule } from '../modules/access';
import { createAdminDashboardModule } from '../modules/admin-dashboard';
import { createAuthModule } from '../modules/auth';
import { createBcvModule } from '../modules/bcv';
import { createBotConfigModule } from '../modules/bot-config';
import { createDashboardModule } from '../modules/dashboard';
import { createEventsModule } from '../modules/events';
import { createExchangeRatesModule } from '../modules/exchange-rates';
import { createInternalBotModule } from '../modules/internal-bot';
import { createPaymentMethodsModule } from '../modules/payment-methods';
import { createPublicEventsModule } from '../modules/public-events';
import { createSalesModule } from '../modules/sales';
import { createStaffModule } from '../modules/staff';
import { createTicketTypesModule } from '../modules/ticket-types';
import { createTicketsModule, TicketCryptoService } from '../modules/tickets';
import { createUsersModule } from '../modules/users';

import { BcvProvider } from './bcv/provider';
import BotTokenCipher from './BotTokenCipher';
import PrismaTransactionManager from './PrismaTransactionManager';
import PrismaAccessLogRepository from './repositories/PrismaAccessLogRepository';
import PrismaBcvRateRepository from './repositories/PrismaBcvRateRepository';
import PrismaCustomerRepository from './repositories/PrismaCustomerRepository';
import PrismaDashboardRepository from './repositories/PrismaDashboardRepository';
import PrismaEventBotConfigRepository from './repositories/PrismaEventBotConfigRepository';
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
    bcvRate: new PrismaBcvRateRepository(prisma),
    dashboard: new PrismaDashboardRepository(prisma),
    eventBotConfig: new PrismaEventBotConfigRepository(prisma),
};

const txManager = new PrismaTransactionManager(prisma);

const ticketQrSecret = process.env.TICKET_QR_SECRET;
if (!ticketQrSecret) {
    throw new EnvironmentVariableError('TICKET_QR_SECRET');
}

const cryptoService = new TicketCryptoService(ticketQrSecret);

const botTokenEncryptionKey = process.env.BOT_TOKEN_ENCRYPTION_KEY;
if (!botTokenEncryptionKey) {
    throw new EnvironmentVariableError('BOT_TOKEN_ENCRYPTION_KEY');
}

const botTokenCipher = new BotTokenCipher(botTokenEncryptionKey);

const { router: ticketsRouter, ticketsService } = createTicketsModule(
    repositories.ticket,
    cryptoService,
);

export const providers = {
    bcv: new BcvProvider(
        repositories.bcvRate,
        repositories.event,
        repositories.exchangeRate,
        repositories.ticketType,
        process.env.BCV_CACHE_TTL_MS,
    ),
};

export async function initializeProviders(): Promise<void> {
    await providers.bcv.init();
}

export const modules = {
    auth: createAuthModule(repositories.user),
    users: createUsersModule(repositories.user),
    events: createEventsModule(repositories.event, repositories.ticketType),
    'events/:eventId/ticket-types': createTicketTypesModule(
        repositories.ticketType,
        repositories.event,
        repositories.exchangeRate,
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
        repositories.bcvRate,
        repositories.event,
    ),
    'events/:eventId/bot-config': createBotConfigModule(
        repositories.eventBotConfig,
        repositories.event,
        botTokenCipher,
    ),
    'events/:eventId/public': createPublicEventsModule(repositories.event, repositories.ticketType),
    'events/:eventId': ticketsRouter,
    'events/:eventId/access': createAccessModule(
        repositories.ticket,
        repositories.accessLog,
        cryptoService,
        repositories.event,
    ),
    'events/:eventId/dashboard': createDashboardModule(repositories.dashboard),
    'admin/dashboard': createAdminDashboardModule(repositories.dashboard),
    'internal/bot': createInternalBotModule(repositories.eventBotConfig, botTokenCipher),
    'exchange-rates/bcv': createBcvModule(providers.bcv),
};
