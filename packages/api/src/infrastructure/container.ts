import prisma from '../infrastructure/database/PrismaClient';
import { createAuthModule } from '../modules/auth';
import { createEventsModule } from '../modules/events';
import { createUsersModule } from '../modules/users';

import PrismaEventRepository from './repositories/PrismaEventRepository';
import PrismaUserRepository from './repositories/PrismaUserRepository';

export const repositories = {
    user: new PrismaUserRepository(prisma),
    event: new PrismaEventRepository(prisma),
};

export const modules = {
    auth: createAuthModule(repositories.user),
    users: createUsersModule(repositories.user),
    events: createEventsModule(repositories.event),
};
