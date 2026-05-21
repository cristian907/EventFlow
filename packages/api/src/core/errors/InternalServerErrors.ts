abstract class InternalServerError extends Error {
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
