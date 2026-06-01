import { UserToCreateType } from '@eventflow/shared';

import User, { UserRole } from '../../core/entities/User';
import { UserAlreadyExistsError } from '../../core/errors/BusinessErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';
import {
    Prisma,
    PrismaClient,
    User as PrismaUser,
    UserRole as PrismaUserRole,
} from '../../generated/prisma/client';
const toDomainRole = (role: PrismaUserRole): UserRole =>
    role === PrismaUserRole.ADMIN ? UserRole.Admin : UserRole.User;

const toPrismaRole = (role: UserRole): PrismaUserRole =>
    role === UserRole.Admin ? PrismaUserRole.ADMIN : PrismaUserRole.USER;

export default class PrismaUserRepository implements IUserRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToUserEntity(prismaUser: PrismaUser): User {
        return new User(
            prismaUser.id,
            prismaUser.fullName,
            prismaUser.email,
            prismaUser.passwordHash,
            prismaUser.phoneNumber,
            toDomainRole(prismaUser.role),
            prismaUser.isActive,
            prismaUser.createdBy,
            prismaUser.createdAt,
            prismaUser.updatedAt,
        );
    }

    async create(user: UserToCreateType & { createdBy?: string }): Promise<User> {
        try {
            const createdUser = await this.prismaClient.user.create({
                data: {
                    email: user.email,
                    passwordHash: user.password,
                    fullName: user.fullName,
                    phoneNumber: user.phoneNumber,
                    createdBy: user.createdBy ?? null,
                },
            });
            return this.mapToUserEntity(createdUser);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new UserAlreadyExistsError(user.email);
            }
            throw error;
        }
    }

    async findById(id: string): Promise<User | null> {
        const prismaUser = await this.prismaClient.user.findUnique({
            where: { id },
            include: { eventMembers: true },
        });

        return prismaUser ? this.mapToUserEntity(prismaUser) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const prismaUser = await this.prismaClient.user.findUnique({
            where: { email },
        });

        return prismaUser ? this.mapToUserEntity(prismaUser) : null;
    }

    async update(id: string, userData: Partial<UserToCreateType>): Promise<User> {
        const dataToUpdate: Prisma.UserUpdateInput = {};

        if (userData.email) {
            dataToUpdate.email = userData.email;
        }
        if (userData.password) {
            dataToUpdate.passwordHash = userData.password;
        }
        if (userData.fullName) {
            dataToUpdate.fullName = userData.fullName;
        }
        if (userData.phoneNumber) {
            dataToUpdate.phoneNumber = userData.phoneNumber;
        }

        try {
            const updatedUser = await this.prismaClient.user.update({
                where: { id },
                data: dataToUpdate,
            });
            return this.mapToUserEntity(updatedUser);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                if (userData.email) throw new UserAlreadyExistsError(userData.email);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        await this.prismaClient.user.delete({
            where: { id },
        });
    }

    async findAndCount(options: {
        page: number;
        limit: number;
        search?: string;
        role?: UserRole;
    }): Promise<{ users: User[]; total: number }> {
        const { page, limit, search, role } = options;
        const skip = (page - 1) * limit;
        const take = limit;

        const where: Prisma.UserWhereInput = {};

        if (role) {
            where.role = toPrismaRole(role);
        }

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [prismaUsers, total] = await Promise.all([
            this.prismaClient.user.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prismaClient.user.count({ where }),
        ]);

        return {
            users: prismaUsers.map((pu) => this.mapToUserEntity(pu)),
            total,
        };
    }

    async updateActive(id: string, isActive: boolean): Promise<User> {
        const updatedUser = await this.prismaClient.user.update({
            where: { id },
            data: { isActive },
        });
        return this.mapToUserEntity(updatedUser);
    }
}
