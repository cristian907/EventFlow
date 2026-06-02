import { TicketListResponse } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const ticketService = {
    async listByOrder(eventId: string, orderId: string): Promise<TicketListResponse> {
        const response = await api.get<TicketListResponse>(
            `/events/${eventId}/orders/${orderId}/tickets`,
        );
        return response.data;
    },

    async downloadTicket(eventId: string, ticketId: string): Promise<void> {
        const response = await api.get(`/events/${eventId}/tickets/${ticketId}/download`, {
            responseType: 'blob',
        });
const url = window.URL.createObjectURL(response.data as Blob);
const a = document.createElement('a');
a.href = url;
a.download = `ticket-${ticketId.slice(0, 8)}.png`;
document.body.appendChild(a);
a.click();
a.remove();
setTimeout(() => window.URL.revokeObjectURL(url), 0);
    },
};
