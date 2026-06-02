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

export class DuplicateMemberError extends BusinessError {
    public readonly name = 'DuplicateMemberError';
    public readonly statusCode = 409;

    constructor() {
        super('El usuario ya es miembro de este evento.');
    }
}

export class EventMemberNotFoundError extends BusinessError {
    public readonly name = 'EventMemberNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún miembro del staff con el ID ${id} para este evento.`);
    }
}

export class RemoveLastAdminError extends BusinessError {
    public readonly name = 'RemoveLastAdminError';
    public readonly statusCode = 400;

    constructor() {
        super('No puedes eliminar o degradar al último administrador activo del evento.');
    }
}

export class PasswordRequiredError extends BusinessError {
    public readonly name = 'PasswordRequiredError';
    public readonly statusCode = 400;

    constructor() {
        super('La contraseña es obligatoria para crear una cuenta nueva.');
    }
}

export class ModifyOrganizerError extends BusinessError {
    public readonly name = 'ModifyOrganizerError';
    public readonly statusCode = 400;

    constructor() {
        super(
            'No está permitido modificar o desactivar al creador/organizador principal del evento.',
        );
    }
}

export class PaymentMethodNotFoundError extends BusinessError {
    public readonly name = 'PaymentMethodNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún método de pago con el ID ${id}.`);
    }
}

export class ExchangeRateNotFoundError extends BusinessError {
    public readonly name = 'ExchangeRateNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ninguna tasa de cambio con el ID ${id}.`);
    }
}

export class MaxCapacityBelowAssignedError extends BusinessError {
    public readonly name = 'MaxCapacityBelowAssignedError';
    public readonly statusCode = 400;

    constructor(requested: number, assigned: number) {
        super(
            `La capacidad máxima (${requested}) no puede ser menor a la suma de entradas ya configuradas (${assigned}).`,
        );
    }
}

export class InsufficientTicketsError extends BusinessError {
    public readonly name = 'InsufficientTicketsError';
    public readonly statusCode = 409;

    constructor() {
        super('No hay suficientes entradas disponibles para completar esta venta.');
    }
}

export class NoActiveExchangeRateError extends BusinessError {
    public readonly name = 'NoActiveExchangeRateError';
    public readonly statusCode = 400;

    constructor() {
        super(
            'El evento no tiene una tasa de cambio vigente. Configure una tasa antes de registrar ventas.',
        );
    }
}

export class InsufficientPaymentError extends BusinessError {
    public readonly name = 'InsufficientPaymentError';
    public readonly statusCode = 400;

    constructor(totalAmount: number, paidAmount: number) {
        super(
            `El monto pagado (${paidAmount.toFixed(2)} USD) no cubre el total de la orden (${totalAmount.toFixed(2)} USD).`,
        );
    }
}

export class OrderNotFoundError extends BusinessError {
    public readonly name = 'OrderNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ninguna orden con el ID ${id}.`);
    }
}

export class TicketTypeNotSellableError extends BusinessError {
    public readonly name = 'TicketTypeNotSellableError';
    public readonly statusCode = 400;

    constructor(reason: string) {
        super(`El tipo de entrada no está disponible para venta: ${reason}`);
    }
}

export class TicketNotFoundError extends BusinessError {
    public readonly name = 'TicketNotFoundError';
    public readonly statusCode = 404;

    constructor(id: string) {
        super(`No se encontró ningún ticket con el ID ${id}.`);
    }
}

export class TicketAlreadyUsedError extends BusinessError {
    public readonly name = 'TicketAlreadyUsedError';
    public readonly statusCode = 409;

    constructor() {
        super('El ticket ya fue utilizado o no es válido.');
    }
}

export class InvalidQrSignatureError extends BusinessError {
    public readonly name = 'InvalidQrSignatureError';
    public readonly statusCode = 400;

    constructor() {
        super('La firma del código QR es inválida.');
    }
}

export class TicketEventMismatchError extends BusinessError {
    public readonly name = 'TicketEventMismatchError';
    public readonly statusCode = 403;

    constructor() {
        super('El ticket no pertenece a este evento.');
    }
}
