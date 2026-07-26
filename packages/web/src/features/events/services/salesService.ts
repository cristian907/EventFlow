import { SaleToCreateType, OrderDetailType, ListOrdersResponse } from '@eventflow/shared';

import { api } from '../../../services/axios';

export interface OrderFiltersParams {
    page?: number;
    limit?: number;
    idNumber?: string;
    startDate?: string;
    endDate?: string;
    ticketTypeId?: string;
}

export const salesService = {
    async createSale(eventId: string, data: SaleToCreateType): Promise<OrderDetailType> {
        const response = await api.post<{ order: OrderDetailType }>(
            `/events/${eventId}/sales`,
            data,
        );
        return response.data.order;
    },

    async listOrders(eventId: string, params?: OrderFiltersParams): Promise<ListOrdersResponse> {
        const response = await api.get<ListOrdersResponse>(`/events/${eventId}/sales`, {
            params,
        });
        return response.data;
    },

    async getOrderDetail(eventId: string, orderId: string): Promise<OrderDetailType> {
        const response = await api.get<{ order: OrderDetailType }>(
            `/events/${eventId}/sales/${orderId}`,
        );
        return response.data.order;
    },
};
