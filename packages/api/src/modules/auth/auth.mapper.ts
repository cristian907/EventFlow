import { UserType } from '@eventflow/shared';

import User from '../../core/entities/User';

export default class AuthMapper {
    public static toUserType(user: User): UserType {
        return {
            id: user.id,
            email: user.email,
            fullName: user.name,
            phoneNumber: user.phoneNumber,
            role: user.role,
            isActive: user.isActive,
            theme: (['light', 'dark', 'system'].includes(user.theme) ? user.theme : 'light') as
                | 'light'
                | 'dark'
                | 'system',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
