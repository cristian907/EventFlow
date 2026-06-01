import prisma from '../infrastructure/database/PrismaClient';
import { createAuthModule } from '../modules/auth';
import { createEventsModule } from '../modules/events';
import { createStaffModule } from '../modules/staff';
import { createTicketTypesModule } from '../modules/ticket-types';
import { createUsersModule } from '../modules/users';

import PrismaEventMemberRepository from './repositories/PrismaEventMemberRepository';
import PrismaEventRepository from './repositories/PrismaEventRepository';
import PrismaTicketTypeRepository from './repositories/PrismaTicketTypeRepository';
import PrismaUserRepository from './repositories/PrismaUserRepository';

export const repositories = {
    user: new PrismaUserRepository(prisma),
    event: new PrismaEventRepository(prisma),
    ticketType: new PrismaTicketTypeRepository(prisma),
    eventMember: new PrismaEventMemberRepository(prisma),
};

export const modules = {
    auth: createAuthModule(repositories.user),
    users: createUsersModule(repositories.user),
    events: createEventsModule(repositories.event),
    'events/:eventId/ticket-types': createTicketTypesModule(
        repositories.ticketType,
        repositories.event,
    ),
    'events/:eventId/staff': createStaffModule(
        repositories.eventMember,
        repositories.user,
        repositories.event,
    ),
};
