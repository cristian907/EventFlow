import AccessLog from '../../core/entities/AccessLog';
import type { AccessMethod, AccessResult } from '../../core/entities/AccessLog';
import IAccessLogRepository, {
    AccessLogCreateData,
    AccessLogWithDetails,
} from '../../core/interfaces/repositories/IAccessLogRepository';
import { PrismaClient } from '../../generated/prisma/client';

function mapToEntity(record: {
    id: string;
    eventId: string;
    ticketId: string | null;
    scannedById: string;
    result: string;
    method: string;
    scannedAt: Date;
}): AccessLog {
    return new AccessLog(
        record.id,
        record.eventId,
        record.ticketId,
        record.scannedById,
        record.result as AccessResult,
        record.method as AccessMethod,
        record.scannedAt,
    );
}

export default class PrismaAccessLogRepository implements IAccessLogRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async create(data: AccessLogCreateData): Promise<AccessLog> {
        const record = await this.prisma.accessLog.create({
            data: {
                eventId: data.eventId,
                ticketId: data.ticketId ?? null,
                scannedById: data.scannedById,
                result: data.result,
                method: data.method,
            },
        });
        return mapToEntity(record);
    }

    async findByEvent(
        eventId: string,
        page: number,
        limit: number,
    ): Promise<{ logs: AccessLogWithDetails[]; total: number }> {
        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            this.prisma.accessLog.findMany({
                where: { eventId },
                include: {
                    scannedBy: { select: { fullName: true } },
                    ticket: {
                        select: {
                            ticketType: { select: { name: true } },
                            customer: { select: { fullName: true } },
                        },
                    },
                },
                orderBy: { scannedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.accessLog.count({ where: { eventId } }),
        ]);

        const logs: AccessLogWithDetails[] = records.map((r) => ({
            id: r.id,
            ticketId: r.ticketId,
            scannedByName: r.scannedBy.fullName,
            result: r.result,
            method: r.method,
            scannedAt: r.scannedAt,
            ticketTypeName: r.ticket?.ticketType.name,
            customerName: r.ticket?.customer.fullName,
        }));

        return { logs, total };
    }
}
