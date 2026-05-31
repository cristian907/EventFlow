import { UserToCreate, UserToLogin, UpdateUserRole } from '../schemas/user.schemas';

export type UserRole = 'USER' | 'ADMIN';

export type UserType = {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
};

export type UserToCreateType = UserToCreate;
export type UserToLoginType = UserToLogin;
export type UpdateUserRoleType = UpdateUserRole;
