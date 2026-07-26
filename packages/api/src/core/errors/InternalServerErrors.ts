export abstract class InternalServerError extends Error {
    abstract readonly name: string;
    abstract readonly statusCode: number;
}

export class EnvironmentVariableError extends InternalServerError {
    public readonly name = 'EnvironmentVariableError';
    public readonly statusCode = 500;

    constructor(variableName: string) {
        super(`The environment variable ${variableName} is required but was not found.`);
    }
}

export class BotTokenEncryptionKeyError extends InternalServerError {
    public readonly name = 'BotTokenEncryptionKeyError';
    public readonly statusCode = 500;

    constructor() {
        super('BOT_TOKEN_ENCRYPTION_KEY debe tener al menos 16 caracteres.');
    }
}

export class DecryptionError extends InternalServerError {
    public readonly name = 'DecryptionError';
    public readonly statusCode = 500;

    constructor(message: string) {
        super(message);
    }
}
