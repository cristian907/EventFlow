import { UserToLoginType, UserType } from '@eventflow/shared';
import { compare } from 'bcrypt';
import { sign, SignOptions } from 'jsonwebtoken';
import ms from 'ms';

import { InvalidCredentialsError, UserNotFoundError } from '../../core/errors/BusinessErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';

import AuthMapper from './auth.mapper';

export default class AuthService {
    private readonly jwtSecret: string;
    private readonly jwtExpiresIn: SignOptions['expiresIn'];
    public readonly jwtExpiresInMs: number;

    constructor(private userRepository: IUserRepository) {
        const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;
        if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined in environment variables');
        if (!JWT_EXPIRES_IN)
            throw new Error('JWT_EXPIRES_IN is not defined in environment variables');

        this.jwtSecret = JWT_SECRET;
        this.jwtExpiresIn = JWT_EXPIRES_IN as SignOptions['expiresIn'];
        this.jwtExpiresInMs = ms(JWT_EXPIRES_IN as ms.StringValue);
    }

    public async login(user: UserToLoginType): Promise<UserType> {
        const existingUser = await this.userRepository.findByEmail(user.email);

        if (!existingUser) {
            throw new UserNotFoundError(user.email);
        }

        const passwordIsValid = await compare(user.password, existingUser.passwordHash);

        if (!passwordIsValid) {
            throw new InvalidCredentialsError();
        }

        return AuthMapper.toUserType(existingUser);
    }

    public getJWT(userId: string): string {
        return sign({ userId }, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }
}
