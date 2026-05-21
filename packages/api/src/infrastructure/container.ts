import prisma from '../infrastructure/database/PrismaClient';
import { createAuthModule } from '../modules/auth';

import PrismaUserRepository from './repositories/PrismaUserRepository';

export const repositories = {
    user: new PrismaUserRepository(prisma),
};

export const modules = {
    auth: createAuthModule(repositories.user),
};
