import BcvRate from '../../core/entities/BcvRate';
import IBcvRateRepository from '../../core/interfaces/repositories/IBcvRateRepository';
import { PrismaClient } from '../../generated/prisma/client';

export default class PrismaBcvRateRepository implements IBcvRateRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEntity(prisma: {
        id: string;
        usdRate: { toNumber(): number };
        eurRate: { toNumber(): number };
        usdtRate: { toNumber(): number } | null;
        valueDate: Date | null;
        scrapedAt: Date;
        createdAt: Date;
    }): BcvRate {
        return new BcvRate(
            prisma.id,
            prisma.usdRate.toNumber(),
            prisma.eurRate.toNumber(),
            prisma.usdtRate ? prisma.usdtRate.toNumber() : null,
            prisma.valueDate,
            prisma.scrapedAt,
            prisma.createdAt,
        );
    }

    async create(data: {
        usdRate: number;
        eurRate: number;
        usdtRate: number | null;
        valueDate: Date | null;
        scrapedAt: Date;
    }): Promise<BcvRate> {
        const created = await this.prismaClient.bcvRate.create({
            data: {
                usdRate: data.usdRate,
                eurRate: data.eurRate,
                usdtRate: data.usdtRate,
                valueDate: data.valueDate,
                scrapedAt: data.scrapedAt,
            },
        });
        return this.mapToEntity(created);
    }

    async findLatest(): Promise<BcvRate | null> {
        const found = await this.prismaClient.bcvRate.findFirst({
            orderBy: { scrapedAt: 'desc' },
        });
        return found ? this.mapToEntity(found) : null;
    }
}
