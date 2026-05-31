import { EventType, EventToCreateType } from '@eventflow/shared';

import { api } from '../../../services/axios';

export interface ListEventsResponse {
    events: EventType[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface EventDetailResponse {
    event: EventType;
    eventRole: string;
}

export const eventService = {
    async listEvents(params?: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<ListEventsResponse> {
        const response = await api.get<ListEventsResponse>('/events', { params });
        return response.data;
    },

    async createEvent(data: EventToCreateType): Promise<EventType> {
        const response = await api.post<{ event: EventType }>('/events', data);
        return response.data.event;
    },

    async getEventDetail(eventId: string): Promise<EventDetailResponse> {
        const response = await api.get<EventDetailResponse>(`/events/${eventId}`);
        return response.data;
    },
};
