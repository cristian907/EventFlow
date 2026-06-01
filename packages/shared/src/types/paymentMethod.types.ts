import { PaymentMethodToCreate, PaymentMethodToUpdate } from '../schemas/paymentMethod.schemas';

export type PaymentMethodCurrency = 'USD' | 'VES' | 'EUR';

export interface PaymentMethodType {
    id: string;
    eventId: string;
    name: string;
    details: string;
    currency: PaymentMethodCurrency;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export type PaymentMethodToCreateType = PaymentMethodToCreate;
export type PaymentMethodToUpdateType = PaymentMethodToUpdate;
