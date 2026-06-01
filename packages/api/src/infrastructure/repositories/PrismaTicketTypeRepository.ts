import TicketType from '../../core/entities/TicketType';
import ITicketTypeRepository from '../../core/interfaces/repositories/ITicketTypeRepository';
import {
    PrismaClient,
    TicketType as PrismaTicketType,
    Currency as PrismaCurrency,
} from '../../generated/prisma/client';

export default class PrismaTicketTypeRepository implements ITicketTypeRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEntity(prisma: PrismaTicketType): TicketType {
        return new TicketType(
            prisma.id,
            prisma.eventId,
            prisma.name,
            prisma.description,
            prisma.price,
            prisma.currency,
            prisma.totalQuantity,
            prisma.soldQuantity,
            prisma.isActive,
            prisma.saleStartsAt,
            prisma.saleEndsAt,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    async create(data: {
        eventId: string;
        name: string;
        description: string;
        price: number;
        currency: string;
        totalQuantity: number;
        saleStartsAt?: Date | null;
        saleEndsAt?: Date | null;
    }): Promise<TicketType> {
        const created = await this.prismaClient.ticketType.create({
            data: {
                eventId: data.eventId,
                name: data.name,
                description: data.description,
                price: data.price,
                currency: data.currency as PrismaCurrency,
                totalQuantity: data.totalQuantity,
                soldQuantity: 0,
                isActive: true,
                saleStartsAt: data.saleStartsAt ?? null,
                saleEndsAt: data.saleEndsAt ?? null,
            },
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<TicketType | null> {
        const found = await this.prismaClient.ticketType.findUnique({ where: { id } });
        return found ? this.mapToEntity(found) : null;
    }

    async findByEventId(eventId: string, includeInactive = true): Promise<TicketType[]> {
        const where: { eventId: string; isActive?: boolean } = { eventId };
        if (!includeInactive) {
            where.isActive = true;
        }

        const list = await this.prismaClient.ticketType.findMany({
            where,
            orderBy: { createdAt: 'asc' },
        });
        return list.map((t) => this.mapToEntity(t));
    }

    async update(
        id: string,
        data: {
            name?: string;
            description?: string;
            price?: number;
            currency?: string;
            totalQuantity?: number;
            isActive?: boolean;
            saleStartsAt?: Date | null;
            saleEndsAt?: Date | null;
        },
    ): Promise<TicketType> {
        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.currency !== undefined) updateData.currency = data.currency as PrismaCurrency;
        if (data.totalQuantity !== undefined) updateData.totalQuantity = data.totalQuantity;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.saleStartsAt !== undefined) updateData.saleStartsAt = data.saleStartsAt;
        if (data.saleEndsAt !== undefined) updateData.saleEndsAt = data.saleEndsAt;

        const updated = await this.prismaClient.ticketType.update({
            where: { id },
            data: updateData,
        });
        return this.mapToEntity(updated);
    }

    async sumTotalQuantityByEventId(eventId: string, excludeId?: string): Promise<number> {
        const where: { eventId: string; id?: { not: string } } = { eventId };
        if (excludeId) {
            where.id = { not: excludeId };
        }

        const result = await this.prismaClient.ticketType.aggregate({
            where,
            _sum: { totalQuantity: true },
        });
        return result._sum.totalQuantity ?? 0;
    }
}
