import Event, { EventStatus } from '../../core/entities/Event';
import IEventRepository from '../../core/interfaces/repositories/IEventRepository';
import {
    Prisma,
    PrismaClient,
    Event as PrismaEvent,
    EventStatus as PrismaEventStatus,
    EventMemberRole as PrismaEventMemberRole,
} from '../../generated/prisma/client';

const toDomainStatus = (status: PrismaEventStatus): EventStatus => {
    if (status === PrismaEventStatus.ACTIVE) return EventStatus.Active;
    if (status === PrismaEventStatus.CANCELLED) return EventStatus.Cancelled;
    return EventStatus.Draft;
};

const toPrismaStatus = (status: EventStatus): PrismaEventStatus => {
    if (status === EventStatus.Active) return PrismaEventStatus.ACTIVE;
    if (status === EventStatus.Cancelled) return PrismaEventStatus.CANCELLED;
    return PrismaEventStatus.DRAFT;
};

export default class PrismaEventRepository implements IEventRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToEventEntity(prismaEvent: PrismaEvent): Event {
        return new Event(
            prismaEvent.id,
            prismaEvent.organizerId,
            prismaEvent.imageUrl,
            prismaEvent.name,
            prismaEvent.description,
            prismaEvent.startDate,
            prismaEvent.endDate,
            prismaEvent.startTime,
            prismaEvent.endTime,
            prismaEvent.location,
            prismaEvent.address,
            prismaEvent.maxCapacity,
            toDomainStatus(prismaEvent.status),
            prismaEvent.autoSyncBcv,
            prismaEvent.rateSource,
            prismaEvent.createdAt,
            prismaEvent.updatedAt,
        );
    }

    async create(eventData: {
        organizerId: string;
        name: string;
        description: string;
        startDate: Date;
        endDate: Date;
        startTime: Date;
        endTime: Date;
        location: string;
        address: string;
        maxCapacity: number;
        imageUrl: string;
        rateSource?: string;
        autoSyncBcv?: boolean;
    }): Promise<Event> {
        const createdEvent = await this.prismaClient.event.create({
            data: {
                organizerId: eventData.organizerId,
                name: eventData.name,
                description: eventData.description,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                startTime: eventData.startTime,
                endTime: eventData.endTime,
                location: eventData.location,
                address: eventData.address,
                maxCapacity: eventData.maxCapacity,
                imageUrl: eventData.imageUrl,
                autoSyncBcv: eventData.autoSyncBcv ?? false,
                rateSource: eventData.rateSource ?? 'CUSTOM',
                status: PrismaEventStatus.DRAFT,
                eventMembers: {
                    create: {
                        userId: eventData.organizerId,
                        role: PrismaEventMemberRole.ADMIN,
                    },
                },
            },
        });
        return this.mapToEventEntity(createdEvent);
    }

    async findById(id: string): Promise<Event | null> {
        const prismaEvent = await this.prismaClient.event.findUnique({
            where: { id },
        });
        return prismaEvent ? this.mapToEventEntity(prismaEvent) : null;
    }

    async findAndCount(options: {
        page: number;
        limit: number;
        search?: string;
        status?: EventStatus;
        userId?: string;
    }): Promise<{ events: Event[]; total: number }> {
        const { page, limit, search, status, userId } = options;
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.EventWhereInput = {};
        const andFilters: Prisma.EventWhereInput[] = [];

        if (status) {
            andFilters.push({ status: toPrismaStatus(status) });
        }

        if (search) {
            andFilters.push({
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                    { location: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (userId) {
            andFilters.push({
                OR: [{ organizerId: userId }, { eventMembers: { some: { userId } } }],
            });
        }

        if (andFilters.length > 0) {
            where.AND = andFilters;
        }

        const [prismaEvents, total] = await Promise.all([
            this.prismaClient.event.findMany({
                where,
                skip,
                take,
                orderBy: { startDate: 'asc' },
            }),
            this.prismaClient.event.count({ where }),
        ]);

        return {
            events: prismaEvents.map((pe) => this.mapToEventEntity(pe)),
            total,
        };
    }

    async update(
        id: string,
        data: {
            name?: string;
            description?: string;
            startDate?: Date;
            endDate?: Date;
            startTime?: Date;
            endTime?: Date;
            location?: string;
            address?: string;
            maxCapacity?: number;
            imageUrl?: string;
            rateSource?: string;
            autoSyncBcv?: boolean;
            status?: EventStatus;
        },
    ): Promise<Event> {
        const updateData: Prisma.EventUpdateInput = {
            ...data,
            status: data.status ? toPrismaStatus(data.status) : undefined,
        };
        const updated = await this.prismaClient.event.update({
            where: { id },
            data: updateData,
        });
        return this.mapToEventEntity(updated);
    }

    async getMemberRole(eventId: string, userId: string): Promise<string | null> {
        const member = await this.prismaClient.eventMember.findFirst({
            where: {
                eventId,
                userId,
            },
        });
        return member ? member.role : null;
    }

    async createMember(eventId: string, userId: string, role: string): Promise<void> {
        await this.prismaClient.eventMember.create({
            data: {
                eventId,
                userId,
                role: role as PrismaEventMemberRole,
            },
        });
    }

    async findActiveAutoSyncEvents(): Promise<Event[]> {
        const prismaEvents = await this.prismaClient.event.findMany({
            where: {
                rateSource: { not: 'CUSTOM' },
                status: { not: PrismaEventStatus.CANCELLED },
            },
        });
        return prismaEvents.map((pe) => this.mapToEventEntity(pe));
    }
}
