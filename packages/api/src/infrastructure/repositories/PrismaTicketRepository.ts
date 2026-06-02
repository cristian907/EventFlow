import Ticket, { TicketStatus } from '../../core/entities/Ticket';
import { ITransactionContext } from '../../core/interfaces/ITransactionContext';
import ITicketRepository, {
    TicketCreateData,
} from '../../core/interfaces/repositories/ITicketRepository';
import { PrismaClient } from '../../generated/prisma/client';

import { getClient } from './prismaTransactionHelper';

type TicketWithRelations = {
    id: string;
    eventId: string;
    orderId: string;
    orderItemId: string;
    customerId: string;
    ticketTypeId: string;
    ticketType: { name: string };
    customer: { fullName: string };
    qrCode: string;
    qrSignature: string;
    status: string;
    issuedAt: Date;
    usedAt: Date | null;
};

const ticketInclude = {
    ticketType: { select: { name: true } },
    customer: { select: { fullName: true } },
};

function mapToEntity(record: TicketWithRelations): Ticket {
    return new Ticket(
        record.id,
        record.eventId,
        record.orderId,
        record.orderItemId,
        record.customerId,
        record.ticketTypeId,
        record.ticketType.name,
        record.customer.fullName,
        record.qrCode,
        record.qrSignature,
        record.status as TicketStatus,
        record.issuedAt,
        record.usedAt,
    );
}

export default class PrismaTicketRepository implements ITicketRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async createMany(data: TicketCreateData[], tx?: ITransactionContext): Promise<Ticket[]> {
        const client = getClient(this.prisma, tx);
        const tickets: Ticket[] = [];

        for (const d of data) {
            const record = await client.ticket.create({
                data: {
                    eventId: d.eventId,
                    orderId: d.orderId,
                    orderItemId: d.orderItemId,
                    customerId: d.customerId,
                    ticketTypeId: d.ticketTypeId,
                    qrCode: d.qrCode,
                    qrSignature: d.qrSignature,
                },
                include: ticketInclude,
            });
            tickets.push(mapToEntity(record as unknown as TicketWithRelations));
        }

        return tickets;
    }

    async findByOrderId(eventId: string, orderId: string): Promise<Ticket[]> {
        const records = await this.prisma.ticket.findMany({
            where: { eventId, orderId },
            include: ticketInclude,
            orderBy: { issuedAt: 'asc' },
        });
        return (records as unknown as TicketWithRelations[]).map(mapToEntity);
    }

    async findById(eventId: string, ticketId: string): Promise<Ticket | null> {
        const record = await this.prisma.ticket.findFirst({
            where: { id: ticketId, eventId },
            include: ticketInclude,
        });
        return record ? mapToEntity(record as unknown as TicketWithRelations) : null;
    }

    async countByOrderId(orderId: string, tx?: ITransactionContext): Promise<number> {
        const client = getClient(this.prisma, tx);
        return client.ticket.count({ where: { orderId } });
    }

    async markAsUsed(qrCode: string): Promise<Ticket | null> {
        const result = await this.prisma.$executeRaw`
            UPDATE "Ticket"
            SET status = 'USED', "usedAt" = NOW()
            WHERE "qrCode" = ${qrCode} AND status = 'VALID'
        `;

        if (result === 0) return null;

        const record = await this.prisma.ticket.findUnique({
            where: { qrCode },
            include: ticketInclude,
        });
        return record ? mapToEntity(record as unknown as TicketWithRelations) : null;
    }
}
