import { UserType } from '@eventflow/shared';

import { UserRole } from '../../core/entities/User';
import { SelfDegradeError, UserNotFoundByIdError } from '../../core/errors/BusinessErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';
import { requestContext } from '../../infrastructure/http/authMiddleware';
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

    public async updateUserRole(targetUserId: string, newRoleStr: string): Promise<UserType> {
        const store = requestContext.getStore();

        let newRole = UserRole.User;
        if (newRoleStr === 'ADMIN') {
            newRole = UserRole.Admin;
        }

        // Prevent self-degradation of current admin to user
        if (store?.userId === targetUserId && newRole === UserRole.User) {
            throw new SelfDegradeError();
        }

        const existingUser = await this.userRepository.findById(targetUserId);
        if (!existingUser) {
            throw new UserNotFoundByIdError(targetUserId);
        }

        const updatedUser = await this.userRepository.updateRole(targetUserId, newRole);
        return AuthMapper.toUserType(updatedUser);
    }
}
