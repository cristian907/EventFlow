import {
    AccessSearchResponse,
    AccessVerifyResponse,
    AccessLogListResponse,
} from '@eventflow/shared';

import { api } from '../../../services/axios';

export const accessService = {
    async scan(eventId: string, qrData: string): Promise<AccessVerifyResponse> {
        const res = await api.post<AccessVerifyResponse>(`/events/${eventId}/access/scan`, {
            qrData,
        });
        return res.data;
    },

    async search(eventId: string, idNumber: string): Promise<AccessSearchResponse> {
        const res = await api.get<AccessSearchResponse>(`/events/${eventId}/access/search`, {
            params: { idNumber },
        });
        return res.data;
    },

    async manualUse(eventId: string, ticketId: string): Promise<AccessVerifyResponse> {
        const res = await api.post<AccessVerifyResponse>(
            `/events/${eventId}/access/tickets/${ticketId}/use`,
        );
        return res.data;
    },

    async getLogs(
        eventId: string,
        page: number = 1,
        limit: number = 50,
    ): Promise<AccessLogListResponse> {
        const res = await api.get<AccessLogListResponse>(`/events/${eventId}/access/logs`, {
            params: { page, limit },
        });
        return res.data;
    },
};
