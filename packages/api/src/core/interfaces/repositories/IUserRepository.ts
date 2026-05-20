import { UserToCreateType } from '@eventflow/shared';

import User from '../../entities/User';

export default interface IUserRepository {
    create(user: UserToCreateType): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, userData: Partial<UserToCreateType>): Promise<User>;
    delete(id: string): Promise<void>;
}
