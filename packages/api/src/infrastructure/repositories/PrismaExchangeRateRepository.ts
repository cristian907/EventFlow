import ExchangeRate from '../../core/entities/ExchangeRate';
import IExchangeRateRepository from '../../core/interfaces/repositories/IExchangeRateRepository';
import { PrismaClient } from '../../generated/prisma/client';

export default class PrismaExchangeRateRepository implements IExchangeRateRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEntity(prisma: {
        id: string;
        eventId: string;
        rate: { toNumber(): number };
        source: string;
        setBy: string | null;
        setByUser: { fullName: string } | null;
        effectiveAt: Date;
        createdAt: Date;
    }): ExchangeRate {
        return new ExchangeRate(
            prisma.id,
            prisma.eventId,
            prisma.rate.toNumber(),
            prisma.source as 'manual' | 'bcv',
            prisma.setBy,
            prisma.setByUser?.fullName || 'Sistema',
            prisma.effectiveAt,
            prisma.createdAt,
        );
    }

    async create(data: {
        eventId: string;
        rate: number;
        source: 'manual' | 'bcv';
        setBy?: string;
        effectiveAt: Date;
    }): Promise<ExchangeRate> {
        const created = await this.prismaClient.exchangeRate.create({
            data: {
                eventId: data.eventId,
                rate: data.rate,
                source: data.source,
                setBy: data.setBy,
                effectiveAt: data.effectiveAt,
            },
            include: { setByUser: true },
        });
        return this.mapToEntity(created);
    }

    async findCurrentByEventId(eventId: string): Promise<ExchangeRate | null> {
        const found = await this.prismaClient.exchangeRate.findFirst({
            where: { eventId },
            orderBy: { effectiveAt: 'desc' },
            include: { setByUser: true },
        });
        return found ? this.mapToEntity(found) : null;
    }

    async findAllByEventId(eventId: string): Promise<ExchangeRate[]> {
        const list = await this.prismaClient.exchangeRate.findMany({
            where: { eventId },
            orderBy: { effectiveAt: 'desc' },
            include: { setByUser: true },
        });
        return list.map((er) => this.mapToEntity(er));
    }
}
