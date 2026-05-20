abstract class BusinessError extends Error {
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
