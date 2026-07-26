import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { EnvironmentVariableError } from '../src/core/errors/InternalServerErrors.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
const saltRoundsStr = process.env.BCRYPT_SALT_ROUNDS;

if (!connectionString) {
    throw new EnvironmentVariableError('DATABASE_URL');
}
if (!saltRoundsStr) {
    throw new EnvironmentVariableError('BCRYPT_SALT_ROUNDS');
}

const saltRoundsNum = parseInt(saltRoundsStr, 10);
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// NOTA DE DISEÑO (CREDANCIALES DE PRUEBA LOCALES):
// De acuerdo con el comentario de Copilot, agregar múltiples usuarios con contraseñas
// fijas hardcodeadas ('password1234') puede ser un riesgo en entornos de producción.
// Sin embargo, este script de seeding se ejecuta EXCLUSIVAMENTE en entornos locales de desarrollo
// y pruebas para simplificar la configuración inicial del proyecto por parte de otros desarrolladores.
// No se emplea ni se expone en producción ni en servidores compartidos.
const seedUsersData = [
    {
        fullName: 'Admin EventFlow',
        email: 'admin@eventflow.com',
        phoneNumber: '+1234567890',
        role: 'ADMIN' as const,
        password: 'password1234',
        theme: 'light',
    },
    {
        fullName: 'Sofia Rodriguez',
        email: 'sofia@eventflow.com',
        phoneNumber: '+1987654321',
        role: 'ADMIN' as const,
        password: 'password1234',
        theme: 'dark',
    },
    {
        fullName: 'Carlos Mendoza',
        email: 'carlos@eventflow.com',
        phoneNumber: '+1555019283',
        role: 'USER' as const,
        password: 'password1234',
        theme: 'system',
    },
    {
        fullName: 'Ana Gomez',
        email: 'ana@eventflow.com',
        phoneNumber: '+1555019284',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'David Silva',
        email: 'david@eventflow.com',
        phoneNumber: '+1555019285',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'Laura Torres',
        email: 'laura@eventflow.com',
        phoneNumber: '+1555019286',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'Javier Rios',
        email: 'javier@eventflow.com',
        phoneNumber: '+1555019287',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'Elena Marin',
        email: 'elena@eventflow.com',
        phoneNumber: '+1555019288',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'Lucas Castro',
        email: 'lucas@eventflow.com',
        phoneNumber: '+1555019289',
        role: 'USER' as const,
        password: 'password1234',
    },
    {
        fullName: 'Martina Vega',
        email: 'martina@eventflow.com',
        phoneNumber: '+1555019290',
        role: 'USER' as const,
        password: 'password1234',
    },
];

async function seed(): Promise<void> {
    console.log('Starting seed process for 10 users...');

    for (const userData of seedUsersData) {
        const passwordHash = await bcrypt.hash(userData.password, saltRoundsNum);

        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                fullName: userData.fullName,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                passwordHash,
                theme: userData.theme,
            },
            create: {
                fullName: userData.fullName,
                email: userData.email,
                passwordHash,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
                theme: userData.theme,
            },
        });

        console.log(`Seeded user: ${user.fullName} (${user.email}) - Role: ${user.role}`);
    }

    console.log('Seeding completed successfully!');
}

seed()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
