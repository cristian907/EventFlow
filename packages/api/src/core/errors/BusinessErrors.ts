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

export class DeactivateAdminError extends BusinessError {
    public readonly name = 'DeactivateAdminError';
    public readonly statusCode = 400;

    constructor() {
        super('No está permitido desactivar a usuarios con rol global ADMINISTRADOR.');
    }
}

export class UserNotFoundByIdError extends BusinessError {
    public readonly name = 'UserNotFoundByIdError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún usuario con el ID ${id}.`);
    }
}

export class ForbiddenError extends BusinessError {
    public readonly name = 'ForbiddenError';
    public readonly statusCode = 403;

    constructor() {
        super('No tienes permisos para acceder a este recurso.');
    }
}

export class EventNotFoundError extends BusinessError {
    public readonly name = 'EventNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún evento con el ID ${id}.`);
    }
}

export class TicketTypeNotFoundError extends BusinessError {
    public readonly name = 'TicketTypeNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún tipo de entrada con el ID ${id}.`);
    }
}

export class CapacityExceededError extends BusinessError {
    public readonly name = 'CapacityExceededError';
    public readonly statusCode = 400;

    constructor(maxCapacity: number, currentTotal: number, requested: number) {
        super(
            `La suma de entradas (${currentTotal} existentes + ${requested} solicitadas = ${currentTotal + requested}) supera la capacidad máxima del evento (${maxCapacity}).`,
        );
    }
}

export class InvalidQuantityError extends BusinessError {
    public readonly name = 'InvalidQuantityError';
    public readonly statusCode = 400;

    constructor(soldQuantity: number) {
        super(
            `La cantidad total no puede ser menor que las entradas ya vendidas (${soldQuantity}).`,
        );
    }
}

export class InvalidSaleWindowError extends BusinessError {
    public readonly name = 'InvalidSaleWindowError';
    public readonly statusCode = 400;

    constructor() {
        super(
            'La fecha de fin de venta no puede ser posterior a la fecha y hora de finalización del evento.',
        );
    }
}
