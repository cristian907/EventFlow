import { EventDashboardSummary } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const dashboardService = {
    async getSummary(eventId: string): Promise<EventDashboardSummary> {
        const response = await api.get<EventDashboardSummary>(`/events/${eventId}/dashboard`);
        return response.data;
    },
};
