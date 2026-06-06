import 'dotenv/config';
import crypto from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

import { EnvironmentVariableError } from '../src/core/errors/InternalServerErrors.js';
import { PrismaClient, User } from '../src/generated/prisma/client.js';

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

const seedUsersData = [
    {
        fullName: 'Admin EventFlow',
        email: 'admin@eventflow.com',
        phoneNumber: '+1234567890',
        role: 'ADMIN' as const,
        password: 'password1234',
    },
    {
        fullName: 'Sofia Rodriguez',
        email: 'sofia@eventflow.com',
        phoneNumber: '+1987654321',
        role: 'ADMIN' as const,
        password: 'password1234',
    },
    {
        fullName: 'Carlos Mendoza',
        email: 'carlos@eventflow.com',
        phoneNumber: '+1555019283',
        role: 'USER' as const,
        password: 'password1234',
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

async function cleanDatabase(): Promise<void> {
    console.log('Cleaning database tables...');
    await prisma.accessLog.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});
    await prisma.exchangeRate.deleteMany({});
    await prisma.paymentMethod.deleteMany({});
    await prisma.eventBotConfig.deleteMany({});
    await prisma.eventMember.deleteMany({});
    await prisma.ticketType.deleteMany({});
    await prisma.event.deleteMany({});

    // Handle self-referencing User table
    await prisma.user.updateMany({ data: { createdBy: null } });
    await prisma.user.deleteMany({});

    await prisma.bcvRate.deleteMany({});
    console.log('Database cleaned successfully!');
}

async function seed(): Promise<void> {
    // 1. Clean the database
    await cleanDatabase();

    console.log('Starting seed process...');

    // 2. Seed Users
    const users: Record<string, User> = {};
    for (const userData of seedUsersData) {
        const passwordHash = await bcrypt.hash(userData.password, saltRoundsNum);

        const user = await prisma.user.create({
            data: {
                fullName: userData.fullName,
                email: userData.email,
                passwordHash,
                phoneNumber: userData.phoneNumber,
                role: userData.role,
            },
        });
        users[userData.email] = user;
        console.log(`Seeded user: ${user.fullName} (${user.email}) - Role: ${user.role}`);
    }

    const userSofia = users['sofia@eventflow.com'];
    const userCarlos = users['carlos@eventflow.com'];
    const userAna = users['ana@eventflow.com'];
    const userDavid = users['david@eventflow.com'];
    const userLaura = users['laura@eventflow.com'];

    // 3. Seed Events
    console.log('Seeding events...');
    const event1 = await prisma.event.create({
        data: {
            organizerId: userCarlos.id,
            imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
            name: 'Tech Summit Caracas 2026',
            description:
                'The premier technology conference in Venezuela, showcasing talks on AI, Web development, and Cloud computing.',
            startDate: new Date('2026-06-15T09:00:00Z'),
            endDate: new Date('2026-06-17T18:00:00Z'),
            startTime: new Date('2026-06-15T09:00:00Z'),
            endTime: new Date('2026-06-17T18:00:00Z'),
            location: 'Eurobuilding Hotel',
            address: 'Calle La Guairita, Chuao, Caracas',
            maxCapacity: 500,
            status: 'ACTIVE',
        },
    });

    const event2 = await prisma.event.create({
        data: {
            organizerId: userSofia.id,
            imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
            name: 'Music Festival FestFlow 2026',
            description:
                'An open-air music festival featuring top national and international rock & pop artists.',
            startDate: new Date('2026-07-20T16:00:00Z'),
            endDate: new Date('2026-07-21T02:00:00Z'),
            startTime: new Date('2026-07-20T16:00:00Z'),
            endTime: new Date('2026-07-21T02:00:00Z'),
            location: 'La Carlota Airbase',
            address: 'Autopista Francisco Fajardo, Caracas',
            maxCapacity: 5000,
            status: 'DRAFT',
        },
    });

    const event3 = await prisma.event.create({
        data: {
            organizerId: userCarlos.id,
            imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?w=800',
            name: 'Comedy Night Stand-Up',
            description: 'A night full of laughter with the best local stand-up comedians.',
            startDate: new Date('2026-05-10T20:00:00Z'),
            endDate: new Date('2026-05-10T23:30:00Z'),
            startTime: new Date('2026-05-10T20:00:00Z'),
            endTime: new Date('2026-05-10T23:30:00Z'),
            location: 'Centro Cultural Chacao',
            address: 'Avenida Tamanaco, El Rosal, Caracas',
            maxCapacity: 200,
            status: 'CANCELLED',
        },
    });

    console.log('Seeded events: Tech Summit, FestFlow, Comedy Night.');

    // 4. Seed Event Members
    console.log('Seeding event members...');
    await prisma.eventMember.createMany({
        data: [
            { eventId: event1.id, userId: userCarlos.id, role: 'ORGANIZER', status: 'ACTIVE' },
            { eventId: event1.id, userId: userDavid.id, role: 'SCANNER', status: 'ACTIVE' },
            { eventId: event1.id, userId: userAna.id, role: 'ADMIN', status: 'ACTIVE' },
            { eventId: event1.id, userId: userLaura.id, role: 'COLLABORATOR', status: 'ACTIVE' },
            { eventId: event2.id, userId: userSofia.id, role: 'ORGANIZER', status: 'ACTIVE' },
            { eventId: event3.id, userId: userCarlos.id, role: 'ORGANIZER', status: 'ACTIVE' },
        ],
    });

    // 5. Seed Ticket Types
    console.log('Seeding ticket types...');
    const ticketType1_early = await prisma.ticketType.create({
        data: {
            eventId: event1.id,
            name: 'Early Bird Ticket',
            description: 'Discounted ticket for early registrations. Limited availability.',
            price: 50.0,
            usdPrice: 50.0,
            currency: 'USD',
            totalQuantity: 50,
            soldQuantity: 1,
            isActive: true,
            saleStartsAt: new Date('2026-01-01T00:00:00Z'),
            saleEndsAt: new Date('2026-03-01T00:00:00Z'),
        },
    });

    const ticketType1_general = await prisma.ticketType.create({
        data: {
            eventId: event1.id,
            name: 'General Admission',
            description: 'Standard access ticket to all keynotes, panels, and exhibition area.',
            price: 80.0,
            usdPrice: 80.0,
            currency: 'USD',
            totalQuantity: 300,
            soldQuantity: 5,
            isActive: true,
            saleStartsAt: new Date('2026-03-01T00:00:00Z'),
            saleEndsAt: new Date('2026-06-14T23:59:59Z'),
        },
    });

    const ticketType1_vip = await prisma.ticketType.create({
        data: {
            eventId: event1.id,
            name: 'VIP Experience',
            description:
                'Includes premium front-row seating, access to VIP lounge, and exclusive networking dinner.',
            price: 150.0,
            usdPrice: 150.0,
            currency: 'USD',
            totalQuantity: 50,
            soldQuantity: 1,
            isActive: true,
            saleStartsAt: new Date('2026-03-01T00:00:00Z'),
            saleEndsAt: new Date('2026-06-14T23:59:59Z'),
        },
    });

    await prisma.ticketType.createMany({
        data: [
            {
                eventId: event2.id,
                name: 'General Admission Arena',
                description: 'Standing room access to the main stage area.',
                price: 35.0,
                usdPrice: 35.0,
                currency: 'USD',
                totalQuantity: 4000,
                soldQuantity: 0,
                isActive: true,
            },
            {
                eventId: event2.id,
                name: 'VIP Box',
                description:
                    'Access to elevated VIP viewing deck, private bars, and premium restrooms.',
                price: 100.0,
                usdPrice: 100.0,
                currency: 'USD',
                totalQuantity: 1000,
                soldQuantity: 0,
                isActive: true,
            },
            {
                eventId: event3.id,
                name: 'General Admission',
                description: 'First come first served standard seating.',
                price: 20.0,
                usdPrice: 20.0,
                currency: 'USD',
                totalQuantity: 200,
                soldQuantity: 0,
                isActive: true,
            },
        ],
    });

    // 6. Seed Payment Methods
    console.log('Seeding payment methods...');
    const pmZelle = await prisma.paymentMethod.create({
        data: {
            eventId: event1.id,
            name: 'Zelle',
            details: 'Email: payments@eventflow.com',
            currency: 'USD',
            isActive: true,
        },
    });

    const pmPagoMovil = await prisma.paymentMethod.create({
        data: {
            eventId: event1.id,
            name: 'Pago Móvil (Banco Mercantil)',
            details: 'RIF: J-123456789, Phone: 0412-1111111, Bank: 0105',
            currency: 'VES',
            isActive: true,
        },
    });

    const pmCash = await prisma.paymentMethod.create({
        data: {
            eventId: event1.id,
            name: 'Efectivo USD',
            details: 'Pagar directamente en taquilla',
            currency: 'USD',
            isActive: true,
        },
    });

    // 7. Seed Exchange Rates
    console.log('Seeding exchange rates...');
    const exchangeRate1 = await prisma.exchangeRate.create({
        data: {
            eventId: event1.id,
            rate: 45.5,
            source: 'manual',
            setBy: userCarlos.id,
            effectiveAt: new Date('2026-06-01T00:00:00Z'),
        },
    });

    await prisma.exchangeRate.create({
        data: {
            eventId: event3.id,
            rate: 44.2,
            source: 'manual',
            setBy: userCarlos.id,
            effectiveAt: new Date('2026-05-01T00:00:00Z'),
        },
    });

    // 8. Seed Customers
    console.log('Seeding customers...');
    const customer1 = await prisma.customer.create({
        data: {
            idNumber: 'V-12345678',
            fullName: 'María Pérez',
            email: 'maria.perez@example.com',
            phone: '+584121111111',
        },
    });

    const customer2 = await prisma.customer.create({
        data: {
            idNumber: 'V-87654321',
            fullName: 'José Rodríguez',
            email: 'jose.rodriguez@example.com',
            phone: '+584242222222',
        },
    });

    const customer3 = await prisma.customer.create({
        data: {
            idNumber: 'V-11223344',
            fullName: 'Daniela Jiménez',
            email: 'daniela.j@example.com',
            phone: '+584163333333',
        },
    });

    const customer4 = await prisma.customer.create({
        data: {
            idNumber: 'V-55667788',
            fullName: 'Luis Gómez',
            email: 'luis.gomez@example.com',
            phone: '+584144444444',
        },
    });

    // 9. Seed Orders, OrderItems, Payments, Tickets, AccessLogs
    console.log('Seeding orders, payments, tickets, access logs...');

    // --- Order 1: María Pérez (Zelle, 2 General + 1 Early Bird = 210 USD)
    const order1 = await prisma.order.create({
        data: {
            eventId: event1.id,
            customerId: customer1.id,
            soldById: userCarlos.id,
            exchangeRateId: exchangeRate1.id,
            currency: 'USD',
            totalAmount: 210.0,
            createdAt: new Date('2026-06-02T10:00:00Z'),
        },
    });

    const orderItem1_general = await prisma.orderItem.create({
        data: {
            orderId: order1.id,
            ticketTypeId: ticketType1_general.id,
            quantity: 2,
            unitPrice: 80.0,
            currency: 'USD',
            subtotal: 160.0,
        },
    });

    const orderItem1_early = await prisma.orderItem.create({
        data: {
            orderId: order1.id,
            ticketTypeId: ticketType1_early.id,
            quantity: 1,
            unitPrice: 50.0,
            currency: 'USD',
            subtotal: 50.0,
        },
    });

    await prisma.payment.create({
        data: {
            orderId: order1.id,
            paymentMethodId: pmZelle.id,
            amount: 210.0,
            currency: 'USD',
            reference: 'ZEL-998877',
            status: 'APPROVED',
            verifiedById: userSofia.id,
            verifiedAt: new Date('2026-06-02T10:05:00Z'),
        },
    });

    await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order1.id,
            orderItemId: orderItem1_general.id,
            customerId: customer1.id,
            ticketTypeId: ticketType1_general.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'VALID',
            issuedAt: new Date('2026-06-02T10:10:00Z'),
        },
    });

    await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order1.id,
            orderItemId: orderItem1_general.id,
            customerId: customer1.id,
            ticketTypeId: ticketType1_general.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'VALID',
            issuedAt: new Date('2026-06-02T10:10:00Z'),
        },
    });

    const ticket1_3 = await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order1.id,
            orderItemId: orderItem1_early.id,
            customerId: customer1.id,
            ticketTypeId: ticketType1_early.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'USED',
            issuedAt: new Date('2026-06-02T10:10:00Z'),
            usedAt: new Date('2026-06-15T10:00:00Z'),
        },
    });

    // --- Order 2: José Rodríguez (Pago Móvil, 1 VIP = 150 USD * 45.5 = 6825 VES)
    const order2 = await prisma.order.create({
        data: {
            eventId: event1.id,
            customerId: customer2.id,
            soldById: userCarlos.id,
            exchangeRateId: exchangeRate1.id,
            currency: 'VES',
            totalAmount: 6825.0,
            createdAt: new Date('2026-06-03T14:00:00Z'),
        },
    });

    const orderItem2_vip = await prisma.orderItem.create({
        data: {
            orderId: order2.id,
            ticketTypeId: ticketType1_vip.id,
            quantity: 1,
            unitPrice: 150.0,
            currency: 'USD',
            subtotal: 150.0,
        },
    });

    await prisma.payment.create({
        data: {
            orderId: order2.id,
            paymentMethodId: pmPagoMovil.id,
            amount: 6825.0,
            currency: 'VES',
            reference: 'PM-554433',
            status: 'APPROVED',
            verifiedById: userSofia.id,
            verifiedAt: new Date('2026-06-03T14:15:00Z'),
        },
    });

    await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order2.id,
            orderItemId: orderItem2_vip.id,
            customerId: customer2.id,
            ticketTypeId: ticketType1_vip.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'VALID',
            issuedAt: new Date('2026-06-03T14:20:00Z'),
        },
    });

    // --- Order 3: Daniela Jiménez (Efectivo, 1 General = 80 USD)
    const order3 = await prisma.order.create({
        data: {
            eventId: event1.id,
            customerId: customer3.id,
            soldById: userCarlos.id,
            exchangeRateId: exchangeRate1.id,
            currency: 'USD',
            totalAmount: 80.0,
            createdAt: new Date('2026-06-05T09:00:00Z'),
        },
    });

    const orderItem3_general = await prisma.orderItem.create({
        data: {
            orderId: order3.id,
            ticketTypeId: ticketType1_general.id,
            quantity: 1,
            unitPrice: 80.0,
            currency: 'USD',
            subtotal: 80.0,
        },
    });

    await prisma.payment.create({
        data: {
            orderId: order3.id,
            paymentMethodId: pmCash.id,
            amount: 80.0,
            currency: 'USD',
            reference: 'CASH-01',
            status: 'APPROVED',
            verifiedById: userCarlos.id,
            verifiedAt: new Date('2026-06-05T09:05:00Z'),
        },
    });

    const ticket3_1 = await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order3.id,
            orderItemId: orderItem3_general.id,
            customerId: customer3.id,
            ticketTypeId: ticketType1_general.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'USED',
            issuedAt: new Date('2026-06-05T09:10:00Z'),
            usedAt: new Date('2026-06-15T11:30:00Z'),
        },
    });

    // --- Order 4: Luis Gómez (Pago Móvil, 2 General = 160 USD * 45.5 = 7280 VES)
    const order4 = await prisma.order.create({
        data: {
            eventId: event1.id,
            customerId: customer4.id,
            soldById: userCarlos.id,
            exchangeRateId: exchangeRate1.id,
            currency: 'VES',
            totalAmount: 7280.0,
            createdAt: new Date('2026-06-05T12:00:00Z'),
        },
    });

    const orderItem4_general = await prisma.orderItem.create({
        data: {
            orderId: order4.id,
            ticketTypeId: ticketType1_general.id,
            quantity: 2,
            unitPrice: 80.0,
            currency: 'USD',
            subtotal: 160.0,
        },
    });

    await prisma.payment.create({
        data: {
            orderId: order4.id,
            paymentMethodId: pmPagoMovil.id,
            amount: 7280.0,
            currency: 'VES',
            reference: 'PM-112233',
            status: 'APPROVED',
            verifiedById: userSofia.id,
            verifiedAt: new Date('2026-06-05T12:10:00Z'),
        },
    });

    await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order4.id,
            orderItemId: orderItem4_general.id,
            customerId: customer4.id,
            ticketTypeId: ticketType1_general.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'VALID',
            issuedAt: new Date('2026-06-05T12:15:00Z'),
        },
    });

    await prisma.ticket.create({
        data: {
            eventId: event1.id,
            orderId: order4.id,
            orderItemId: orderItem4_general.id,
            customerId: customer4.id,
            ticketTypeId: ticketType1_general.id,
            qrCode: crypto.randomUUID(),
            qrSignature: crypto.randomUUID(),
            status: 'VALID',
            issuedAt: new Date('2026-06-05T12:15:00Z'),
        },
    });

    // 10. Seed Access Logs
    console.log('Seeding access logs...');
    // Valid check-in for Early Bird ticket
    await prisma.accessLog.create({
        data: {
            eventId: event1.id,
            ticketId: ticket1_3.id,
            scannedById: userDavid.id,
            result: 'VALID',
            method: 'QR',
            scannedAt: new Date('2026-06-15T10:00:00Z'),
        },
    });

    // Valid check-in for General ticket (Daniela)
    await prisma.accessLog.create({
        data: {
            eventId: event1.id,
            ticketId: ticket3_1.id,
            scannedById: userDavid.id,
            result: 'VALID',
            method: 'QR',
            scannedAt: new Date('2026-06-15T11:30:00Z'),
        },
    });

    // Duplicate scan for Daniela's ticket (ALREADY_USED)
    await prisma.accessLog.create({
        data: {
            eventId: event1.id,
            ticketId: ticket3_1.id,
            scannedById: userDavid.id,
            result: 'ALREADY_USED',
            method: 'QR',
            scannedAt: new Date('2026-06-15T11:40:00Z'),
        },
    });

    // Invalid scan (unknown QR code)
    await prisma.accessLog.create({
        data: {
            eventId: event1.id,
            ticketId: null,
            scannedById: userDavid.id,
            result: 'INVALID',
            method: 'QR',
            scannedAt: new Date('2026-06-15T12:00:00Z'),
        },
    });

    // 11. Seed BcvRate historical rates
    console.log('Seeding central bank exchange rates...');
    await prisma.bcvRate.createMany({
        data: [
            {
                usdRate: 45.5,
                eurRate: 49.1,
                usdtRate: 45.4,
                valueDate: new Date('2026-06-05T00:00:00Z'),
                scrapedAt: new Date('2026-06-05T08:00:00Z'),
            },
            {
                usdRate: 45.2,
                eurRate: 48.8,
                usdtRate: 45.1,
                valueDate: new Date('2026-06-04T00:00:00Z'),
                scrapedAt: new Date('2026-06-04T08:00:00Z'),
            },
        ],
    });

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
