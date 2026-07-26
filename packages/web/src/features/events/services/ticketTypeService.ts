import { TicketTypeType, TicketTypeToCreateType, TicketTypeToUpdateType } from '@eventflow/shared';

import { api } from '../../../services/axios';

export interface ListTicketTypesResponse {
    ticketTypes: TicketTypeType[];
    maxCapacity: number;
    totalAssigned: number;
}

export const ticketTypeService = {
    async list(eventId: string, includeInactive = true): Promise<ListTicketTypesResponse> {
        const response = await api.get<ListTicketTypesResponse>(`/events/${eventId}/ticket-types`, {
            params: { includeInactive: String(includeInactive) },
        });
        return response.data;
    },

    async create(eventId: string, data: TicketTypeToCreateType): Promise<TicketTypeType> {
        const response = await api.post<{ ticketType: TicketTypeType }>(
            `/events/${eventId}/ticket-types`,
            data,
        );
        return response.data.ticketType;
    },

    async getById(eventId: string, ticketTypeId: string): Promise<TicketTypeType> {
        const response = await api.get<{ ticketType: TicketTypeType }>(
            `/events/${eventId}/ticket-types/${ticketTypeId}`,
        );
        return response.data.ticketType;
    },

    async update(
        eventId: string,
        ticketTypeId: string,
        data: TicketTypeToUpdateType,
    ): Promise<TicketTypeType> {
        const response = await api.put<{ ticketType: TicketTypeType }>(
            `/events/${eventId}/ticket-types/${ticketTypeId}`,
            data,
        );
        return response.data.ticketType;
    },

    async deactivate(eventId: string, ticketTypeId: string): Promise<TicketTypeType> {
        const response = await api.delete<{ ticketType: TicketTypeType }>(
            `/events/${eventId}/ticket-types/${ticketTypeId}`,
        );
        return response.data.ticketType;
    },
};
