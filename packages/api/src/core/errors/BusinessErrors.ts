export abstract class BusinessError extends Error {
    abstract readonly name: string;
    abstract readonly statusCode: number;
}

export class UserAlreadyExistsError extends BusinessError {
    public readonly name = 'UserAlreadyExistsError';
    public readonly statusCode = 409;

    constructor(email: string) {
        super(`A user with email ${email} already exists.`);
    }
}

export class UserNotFoundError extends BusinessError {
    public readonly name = 'UserNotFoundError';
    public readonly statusCode = 404;

    constructor(email: string) {
        super(`No user found with email ${email}.`);
    }
}

export class InvalidCredentialsError extends BusinessError {
    public readonly name = 'InvalidCredentialsError';
    public readonly statusCode = 401;

    constructor() {
        super('Invalid email or password.');
    }
}

export class UnauthorizedError extends BusinessError {
    public readonly name = 'UnauthorizedError';
    public readonly statusCode = 401;

    constructor() {
        super('You are not authorized to access this resource.');
    }
}
