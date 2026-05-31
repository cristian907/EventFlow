import { UserType } from '@eventflow/shared';

import { UserRole } from '../../core/entities/User';
import { DeactivateAdminError, UserNotFoundByIdError } from '../../core/errors/BusinessErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';
import AuthMapper from '../auth/auth.mapper';

export default class UsersService {
    constructor(private userRepository: IUserRepository) {}

    public async listUsers(options: {
        page: number;
        limit: number;
        search?: string;
        role?: string;
    }): Promise<{ users: UserType[]; total: number; totalPages: number }> {
        const { page, limit, search, role } = options;

        let parsedRole: UserRole | undefined;
        if (role === 'ADMIN') parsedRole = UserRole.Admin;
        if (role === 'USER') parsedRole = UserRole.User;

        const { users, total } = await this.userRepository.findAndCount({
            page,
            limit,
            search,
            role: parsedRole,
        });

        return {
            users: users.map((u) => AuthMapper.toUserType(u)),
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    public async updateUserActive(targetUserId: string, isActive: boolean): Promise<UserType> {
        const existingUser = await this.userRepository.findById(targetUserId);
        if (!existingUser) {
            throw new UserNotFoundByIdError(targetUserId);
        }

        // Block ADMIN deactivation to avoid leaving the system without admins.
        if (existingUser.role === UserRole.Admin && isActive === false) {
            throw new DeactivateAdminError();
        }

        const updatedUser = await this.userRepository.updateActive(targetUserId, isActive);
        return AuthMapper.toUserType(updatedUser);
    }
}
