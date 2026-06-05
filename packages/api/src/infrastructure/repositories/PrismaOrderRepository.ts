import Order, { OrderCustomer, OrderItem, OrderPayment } from '../../core/entities/Order';
import { ITransactionContext } from '../../core/interfaces/ITransactionContext';
import IOrderRepository, {
    OrderCreateData,
    OrderFilters,
} from '../../core/interfaces/repositories/IOrderRepository';
import { PrismaClient, Prisma } from '../../generated/prisma/client';

import { getClient } from './prismaTransactionHelper';

type OrderWithRelations = {
    id: string;
    eventId: string;
    customerId: string;
    soldById: string;
    exchangeRateId: string;
    currency: string;
    totalAmount: { toNumber(): number };
    createdAt: Date;
    soldBy: { fullName: string };
    exchangeRate: { rate: { toNumber(): number } };
    customer?: {
        id: string;
        idNumber: string;
        fullName: string;
        phone: string | null;
        email: string | null;
    };
    items?: Array<{
        id: string;
        orderId: string;
        ticketTypeId: string;
        ticketType: { name: string };
        quantity: number;
        unitPrice: { toNumber(): number };
        currency: string;
        subtotal: { toNumber(): number };
    }>;
    payments?: Array<{
        id: string;
        orderId: string;
        paymentMethodId: string;
        paymentMethod: { name: string };
        amount: { toNumber(): number };
        currency: string;
        reference: string | null;
        receiptUrl: string | null;
        status: string;
        verifiedById: string;
        verifiedAt: Date;
    }>;
};

const orderIncludeDetail = {
    soldBy: { select: { fullName: true } },
    exchangeRate: { select: { rate: true } },
    customer: true,
    items: { include: { ticketType: { select: { name: true } } } },
    payments: { include: { paymentMethod: { select: { name: true } } } },
};

const orderIncludeSummary = {
    soldBy: { select: { fullName: true } },
    exchangeRate: { select: { rate: true } },
    customer: true,
    items: { include: { ticketType: { select: { name: true } } } },
    payments: { include: { paymentMethod: { select: { name: true } } } },
};

function mapToEntity(record: OrderWithRelations): Order {
    const customer: OrderCustomer | undefined = record.customer
        ? {
              id: record.customer.id,
              idNumber: record.customer.idNumber,
              fullName: record.customer.fullName,
              phone: record.customer.phone,
              email: record.customer.email,
          }
        : undefined;

    const items: OrderItem[] | undefined = record.items?.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        ticketTypeId: i.ticketTypeId,
        ticketTypeName: i.ticketType.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toNumber(),
        currency: i.currency,
        subtotal: i.subtotal.toNumber(),
    }));

    const payments: OrderPayment[] | undefined = record.payments?.map((p) => ({
        id: p.id,
        orderId: p.orderId,
        paymentMethodId: p.paymentMethodId,
        paymentMethodName: p.paymentMethod.name,
        amount: p.amount.toNumber(),
        currency: p.currency,
        reference: p.reference,
        receiptUrl: p.receiptUrl,
        status: p.status,
        verifiedById: p.verifiedById,
        verifiedAt: p.verifiedAt,
    }));

    return new Order(
        record.id,
        record.eventId,
        record.customerId,
        record.soldById,
        record.soldBy.fullName,
        record.exchangeRateId,
        record.exchangeRate.rate.toNumber(),
        record.currency,
        record.totalAmount.toNumber(),
        record.createdAt,
        customer,
        items,
        payments,
    );
}

export default class PrismaOrderRepository implements IOrderRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: OrderCreateData, tx?: ITransactionContext): Promise<Order> {
        const client = getClient(this.prisma, tx);
        const record = await client.order.create({
            data: {
                eventId: data.eventId,
                customerId: data.customerId,
                soldById: data.soldById,
                exchangeRateId: data.exchangeRateId,
                currency: data.itemCurrency || 'USD',
                totalAmount: data.totalAmount,
                items: {
                    create: {
                        ticketTypeId: data.ticketTypeId,
                        quantity: data.quantity,
                        unitPrice: data.unitPrice,
                        currency: data.itemCurrency,
                        subtotal: data.subtotal,
                    },
                },
                payments: {
                    create: data.payments.map((p) => ({
                        paymentMethodId: p.paymentMethodId,
                        amount: p.amount,
                        currency: p.currency,
                        reference: p.reference ?? null,
                        receiptUrl: p.receiptUrl ?? null,
                        status: 'APPROVED',
                        verifiedById: p.verifiedById,
                        verifiedAt: new Date(),
                    })),
                },
            },
            include: orderIncludeDetail,
        });
        return mapToEntity(record as unknown as OrderWithRelations);
    }

    async findAndCount(
        eventId: string,
        filters: OrderFilters,
    ): Promise<{ orders: Order[]; total: number }> {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = { eventId };

        if (filters.idNumber) {
            where.customer = { idNumber: { contains: filters.idNumber, mode: 'insensitive' } };
        }
        if (filters.ticketTypeId) {
            where.items = { some: { ticketTypeId: filters.ticketTypeId } };
        }
        if (filters.startDate || filters.endDate) {
            const dateFilter: Prisma.DateTimeFilter = {};
            if (filters.startDate) dateFilter.gte = new Date(filters.startDate);
            if (filters.endDate) dateFilter.lte = new Date(filters.endDate);
            where.createdAt = dateFilter;
        }

        const [records, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                include: orderIncludeSummary,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            orders: (records as unknown as OrderWithRelations[]).map(mapToEntity),
            total,
        };
    }

    async findById(eventId: string, orderId: string): Promise<Order | null> {
        const record = await this.prisma.order.findFirst({
            where: { id: orderId, eventId },
            include: orderIncludeDetail,
        });
        return record ? mapToEntity(record as unknown as OrderWithRelations) : null;
    }
}
