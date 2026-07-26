import PaymentMethod from '../../core/entities/PaymentMethod';
import IPaymentMethodRepository from '../../core/interfaces/repositories/IPaymentMethodRepository';
import {
    PrismaClient,
    PaymentMethod as PrismaPaymentMethod,
    Currency as PrismaCurrency,
} from '../../generated/prisma/client';

export default class PrismaPaymentMethodRepository implements IPaymentMethodRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEntity(prisma: PrismaPaymentMethod): PaymentMethod {
        return new PaymentMethod(
            prisma.id,
            prisma.eventId,
            prisma.name,
            prisma.details,
            prisma.currency,
            prisma.isActive,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    async create(data: {
        eventId: string;
        name: string;
        details: string;
        currency: string;
    }): Promise<PaymentMethod> {
        const created = await this.prismaClient.paymentMethod.create({
            data: {
                eventId: data.eventId,
                name: data.name,
                details: data.details,
                currency: data.currency as PrismaCurrency,
                isActive: true,
            },
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<PaymentMethod | null> {
        const found = await this.prismaClient.paymentMethod.findUnique({ where: { id } });
        return found ? this.mapToEntity(found) : null;
    }

    async findByEventId(eventId: string): Promise<PaymentMethod[]> {
        const list = await this.prismaClient.paymentMethod.findMany({
            where: { eventId, isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        return list.map((pm) => this.mapToEntity(pm));
    }

    async update(
        id: string,
        data: {
            name?: string;
            details?: string;
            currency?: string;
            isActive?: boolean;
        },
    ): Promise<PaymentMethod> {
        const updateData: Record<string, unknown> = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.details !== undefined) updateData.details = data.details;
        if (data.currency !== undefined) updateData.currency = data.currency as PrismaCurrency;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const updated = await this.prismaClient.paymentMethod.update({
            where: { id },
            data: updateData,
        });
        return this.mapToEntity(updated);
    }
}
