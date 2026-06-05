import EventBotConfig from '../../core/entities/EventBotConfig';
import IEventBotConfigRepository, {
    EventBotConfigUpsertData,
} from '../../core/interfaces/repositories/IEventBotConfigRepository';
import {
    PrismaClient,
    EventBotConfig as PrismaEventBotConfig,
} from '../../generated/prisma/client';

export default class PrismaEventBotConfigRepository implements IEventBotConfigRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEntity(prisma: PrismaEventBotConfig): EventBotConfig {
        return new EventBotConfig(
            prisma.id,
            prisma.eventId,
            prisma.telegramBotTokenEncrypted,
            prisma.salesWhatsappNumber,
            prisma.salesHandoffMessage,
            prisma.welcomeMessage,
            prisma.isEnabled,
            prisma.createdAt,
            prisma.updatedAt,
        );
    }

    async findByEventId(eventId: string): Promise<EventBotConfig | null> {
        const found = await this.prismaClient.eventBotConfig.findUnique({ where: { eventId } });
        return found ? this.mapToEntity(found) : null;
    }

    async upsert(eventId: string, data: EventBotConfigUpsertData): Promise<EventBotConfig> {
        const updateData: Record<string, unknown> = {};
        if (data.telegramBotTokenEncrypted !== undefined) {
            updateData.telegramBotTokenEncrypted = data.telegramBotTokenEncrypted;
        }
        if (data.salesWhatsappNumber !== undefined) {
            updateData.salesWhatsappNumber = data.salesWhatsappNumber;
        }
        if (data.salesHandoffMessage !== undefined) {
            updateData.salesHandoffMessage = data.salesHandoffMessage;
        }
        if (data.welcomeMessage !== undefined) updateData.welcomeMessage = data.welcomeMessage;
        if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;

        const upserted = await this.prismaClient.eventBotConfig.upsert({
            where: { eventId },
            update: updateData,
            create: {
                eventId,
                telegramBotTokenEncrypted: data.telegramBotTokenEncrypted ?? null,
                salesWhatsappNumber: data.salesWhatsappNumber ?? null,
                salesHandoffMessage: data.salesHandoffMessage ?? null,
                welcomeMessage: data.welcomeMessage ?? null,
                isEnabled: data.isEnabled ?? false,
            },
        });
        return this.mapToEntity(upserted);
    }

    async findAllEnabledActive(): Promise<EventBotConfig[]> {
        const list = await this.prismaClient.eventBotConfig.findMany({
            where: {
                isEnabled: true,
                telegramBotTokenEncrypted: { not: null },
                event: { status: 'ACTIVE' },
            },
            orderBy: { updatedAt: 'desc' },
        });
        return list.map((c) => this.mapToEntity(c));
    }
}
