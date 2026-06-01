import { StaffMemberType } from '@eventflow/shared';

import IEventMemberRepository from '../../core/interfaces/repositories/IEventMemberRepository';
import {
    PrismaClient,
    EventMember as PrismaEventMember,
    User as PrismaUser,
    EventMemberRole as PrismaEventMemberRole,
    EventMemberStatus as PrismaEventMemberStatus,
    Prisma,
} from '../../generated/prisma/client';

export default class PrismaEventMemberRepository implements IEventMemberRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToDomain(m: PrismaEventMember & { user: PrismaUser }): StaffMemberType {
        return {
            id: m.id,
            eventId: m.eventId,
            userId: m.userId,
            role: m.role.toLowerCase() as StaffMemberType['role'],
            status: m.status.toLowerCase() as StaffMemberType['status'],
            createdAt: m.createdAt,
            user: {
                id: m.user.id,
                fullName: m.user.fullName,
                email: m.user.email,
                phoneNumber: m.user.phoneNumber,
            },
        };
    }

    async listByEvent(
        eventId: string,
        options: { page: number; limit: number; search?: string },
    ): Promise<{ members: StaffMemberType[]; total: number }> {
        const { page, limit, search } = options;
        const skip = (page - 1) * limit;

        const where: Prisma.EventMemberWhereInput = {
            eventId,
        };

        if (search) {
            where.user = {
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [dbMembers, total] = await Promise.all([
            this.prismaClient.eventMember.findMany({
                where,
                include: { user: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prismaClient.eventMember.count({ where }),
        ]);

        return {
            members: dbMembers.map((m) => this.mapToDomain(m)),
            total,
        };
    }

    async findMember(eventId: string, userId: string): Promise<StaffMemberType | null> {
        const m = await this.prismaClient.eventMember.findFirst({
            where: { eventId, userId },
            include: { user: true },
        });
        return m ? this.mapToDomain(m) : null;
    }

    async findMemberById(eventId: string, memberId: string): Promise<StaffMemberType | null> {
        const m = await this.prismaClient.eventMember.findFirst({
            where: { id: memberId, eventId },
            include: { user: true },
        });
        return m ? this.mapToDomain(m) : null;
    }

    async create(eventId: string, userId: string, role: string): Promise<StaffMemberType> {
        const m = await this.prismaClient.eventMember.create({
            data: {
                eventId,
                userId,
                role: role.toUpperCase() as PrismaEventMemberRole,
                status: PrismaEventMemberStatus.ACTIVE,
            },
            include: { user: true },
        });
        return this.mapToDomain(m);
    }

    async update(
        memberId: string,
        data: { role?: string; status?: string },
    ): Promise<StaffMemberType> {
        const prismaData: Prisma.EventMemberUpdateInput = {};
        if (data.role) prismaData.role = data.role.toUpperCase() as PrismaEventMemberRole;
        if (data.status) prismaData.status = data.status.toUpperCase() as PrismaEventMemberStatus;

        const m = await this.prismaClient.eventMember.update({
            where: { id: memberId },
            data: prismaData,
            include: { user: true },
        });
        return this.mapToDomain(m);
    }

    async countActiveAdmins(eventId: string): Promise<number> {
        return this.prismaClient.eventMember.count({
            where: {
                eventId,
                status: PrismaEventMemberStatus.ACTIVE,
                role: { in: [PrismaEventMemberRole.ADMIN, PrismaEventMemberRole.ORGANIZER] },
            },
        });
    }
}
