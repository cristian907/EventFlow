import { UserToCreateType } from '@eventflow/shared';

import User, { UserRole } from '../../entities/User';

export default interface IUserRepository {
    create(user: UserToCreateType): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, userData: Partial<UserToCreateType>): Promise<User>;
    delete(id: string): Promise<void>;
    findAndCount(options: {
        page: number;
        limit: number;
        search?: string;
        role?: UserRole;
    }): Promise<{ users: User[]; total: number }>;
    updateActive(id: string, isActive: boolean): Promise<User>;
}
