import { UserToCreateType } from '@eventflow/shared';

import User from '../../core/entities/User';
import { UserAlreadyExistsError } from '../../core/errors/BusinessErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';
import { Prisma, PrismaClient, User as PrismaUser } from '../../generated/prisma/client.js';

export default class PrismaUserRepository implements IUserRepository {
    constructor(private prismaClient: PrismaClient) {}

    private mapToUserEntity(prismaUser: PrismaUser): User {
        return new User(
            prismaUser.id,
            prismaUser.fullName,
            prismaUser.email,
            prismaUser.passwordHash,
            prismaUser.phoneNumber,
            prismaUser.createdBy,
            prismaUser.createdAt,
            prismaUser.updatedAt,
        );
    }

    async create(user: UserToCreateType): Promise<User> {
        try {
            const createdUser = await this.prismaClient.user.create({
                data: {
                    email: user.email,
                    passwordHash: user.password,
                    fullName: user.fullName,
                    phoneNumber: user.phoneNumber,
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
                throw new UserAlreadyExistsError(userData.email!);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        await this.prismaClient.user.delete({
            where: { id },
        });
    }
}
