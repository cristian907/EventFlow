import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { EnvironmentVariableError } from '../src/core/errors/InternalServerErrors.js';
import { PrismaClient } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new EnvironmentVariableError('DATABASE_URL environment variable is not set.');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed(): Promise<void> {
    const passwordHash = await bcrypt.hash('admin1234', 10);

    const user = await prisma.user.upsert({
        where: { email: 'admin@eventflow.com' },
        update: {},
        create: {
            fullName: 'Admin EventFlow',
            email: 'admin@eventflow.com',
            passwordHash,
            phoneNumber: '+1234567890',
            role: 'ADMIN',
        },
    });

    console.log('Seeded user:', user.email);
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
