import { PrismaPg } from '@prisma/adapter-pg';

import { EnvironmentVariableError } from '../../core/errors/InternalServerErrors.js';
import { PrismaClient } from '../../generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new EnvironmentVariableError('DATABASE_URL');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export default prisma;
