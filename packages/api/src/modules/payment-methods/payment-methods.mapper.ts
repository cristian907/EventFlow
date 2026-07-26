import { PaymentMethodType } from '@eventflow/shared';

import PaymentMethod from '../../core/entities/PaymentMethod';

export default class PaymentMethodsMapper {
    static toPaymentMethodType(entity: PaymentMethod): PaymentMethodType {
        return {
            id: entity.id,
            eventId: entity.eventId,
            name: entity.name,
            details: entity.details,
            currency: entity.currency as PaymentMethodType['currency'],
            isActive: entity.isActive,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
        };
    }
}
