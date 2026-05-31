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

export class SelfDegradeError extends BusinessError {
    public readonly name = 'SelfDegradeError';
    public readonly statusCode = 400;

    constructor() {
        super(
            'No puedes cambiar tu propio rol de ADMIN a USER para evitar dejar el sistema sin administradores.',
        );
    }
}

export class UserNotFoundByIdError extends BusinessError {
    public readonly name = 'UserNotFoundByIdError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún usuario con el ID ${id}.`);
    }
}
