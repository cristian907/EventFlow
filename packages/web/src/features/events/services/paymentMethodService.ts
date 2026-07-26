import {
    PaymentMethodType,
    PaymentMethodToCreateType,
    PaymentMethodToUpdateType,
} from '@eventflow/shared';

import { api } from '../../../services/axios';

export const paymentMethodService = {
    async list(eventId: string): Promise<PaymentMethodType[]> {
        const response = await api.get<{ paymentMethods: PaymentMethodType[] }>(
            `/events/${eventId}/payment-methods`,
        );
        return response.data.paymentMethods;
    },

    async create(eventId: string, data: PaymentMethodToCreateType): Promise<PaymentMethodType> {
        const response = await api.post<{ paymentMethod: PaymentMethodType }>(
            `/events/${eventId}/payment-methods`,
            data,
        );
        return response.data.paymentMethod;
    },

    async update(
        eventId: string,
        methodId: string,
        data: PaymentMethodToUpdateType,
    ): Promise<PaymentMethodType> {
        const response = await api.put<{ paymentMethod: PaymentMethodType }>(
            `/events/${eventId}/payment-methods/${methodId}`,
            data,
        );
        return response.data.paymentMethod;
    },

    async disable(eventId: string, methodId: string): Promise<PaymentMethodType> {
        const response = await api.delete<{ paymentMethod: PaymentMethodType }>(
            `/events/${eventId}/payment-methods/${methodId}`,
        );
        return response.data.paymentMethod;
    },
};
