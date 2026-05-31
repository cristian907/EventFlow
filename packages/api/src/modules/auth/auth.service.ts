import { UserRole, UserToLoginType, UserType } from '@eventflow/shared';
import { compare, hash } from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
const { sign } = jwt;
import ms from 'ms';

import { InvalidCredentialsError } from '../../core/errors/BusinessErrors';
import { EnvironmentVariableError } from '../../core/errors/InternalServerErrors';
import IUserRepository from '../../core/interfaces/repositories/IUserRepository';
import { logger } from '../../infrastructure/logger';

import AuthMapper from './auth.mapper';

export default class AuthService {
    private readonly jwtSecret: string;
    private readonly jwtExpiresIn: SignOptions['expiresIn'];
    public readonly jwtExpiresInMs: number;
    private readonly saltRounds: number;

    constructor(private userRepository: IUserRepository) {
        const { JWT_SECRET, JWT_EXPIRES_IN, BCRYPT_SALT_ROUNDS } = process.env;
        if (!JWT_SECRET) throw new EnvironmentVariableError('JWT_SECRET');
        if (!JWT_EXPIRES_IN) throw new EnvironmentVariableError('JWT_EXPIRES_IN');
        if (!BCRYPT_SALT_ROUNDS) throw new EnvironmentVariableError('BCRYPT_SALT_ROUNDS');

        this.jwtSecret = JWT_SECRET;
        this.jwtExpiresIn = JWT_EXPIRES_IN as SignOptions['expiresIn'];
        this.jwtExpiresInMs = ms(JWT_EXPIRES_IN as ms.StringValue);
        this.saltRounds = parseInt(BCRYPT_SALT_ROUNDS, 10);
    }

    public async login(user: UserToLoginType): Promise<UserType> {
        const existingUser = await this.userRepository.findByEmail(user.email);

        if (!existingUser) {
            logger.warn(`Login attempt with non-existing email: ${user.email}`);
            throw new InvalidCredentialsError();
        }

        const passwordIsValid = await compare(user.password, existingUser.passwordHash);

        if (!passwordIsValid) {
            logger.warn(`Invalid password attempt for email: ${user.email}`);
            throw new InvalidCredentialsError();
        }

        return AuthMapper.toUserType(existingUser);
    }

    public async encrypt(plaintext: string): Promise<string> {
        return hash(plaintext, this.saltRounds);
    }

    public getJWT(userId: string, role: UserRole): string {
        return sign({ userId, role }, this.jwtSecret, { expiresIn: this.jwtExpiresIn });
    }

    public async getCurrentUser(userId: string): Promise<UserType> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new InvalidCredentialsError();
        }
        return AuthMapper.toUserType(user);
    }
}
