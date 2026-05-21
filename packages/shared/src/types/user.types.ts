import { UserToCreate } from '../schemas/user.schemas.js';
import { UserToLogin } from '../schemas/user.schemas.js';

export type UserType = {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    createdAt: Date;
    updatedAt: Date;
};

export type UserToCreateType = UserToCreate;
export type UserToLoginType = UserToLogin;
