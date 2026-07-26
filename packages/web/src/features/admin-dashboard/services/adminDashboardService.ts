import { GlobalDashboardSummary, GlobalDashboardQuery } from '@eventflow/shared';

import { api } from '../../../services/axios';

export const adminDashboardService = {
    async getGlobalSummary(query: Partial<GlobalDashboardQuery>): Promise<GlobalDashboardSummary> {
        const params = new URLSearchParams();
        if (query.page) params.append('page', String(query.page));
        if (query.limit) params.append('limit', String(query.limit));
        if (query.search) params.append('search', query.search);
        if (query.status) params.append('status', query.status);
        if (query.sortBy) params.append('sortBy', query.sortBy);
        if (query.sortOrder) params.append('sortOrder', query.sortOrder);

        const response = await api.get<GlobalDashboardSummary>(
            `/admin/dashboard?${params.toString()}`,
        );
        return response.data;
    },
};
