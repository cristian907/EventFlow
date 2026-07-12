import { GlobalDashboardQuery, GlobalDashboardSummary } from '@eventflow/shared';

import IDashboardRepository from '../../core/interfaces/repositories/IDashboardRepository';

export default class AdminDashboardService {
    constructor(private readonly dashboardRepository: IDashboardRepository) {}

    async getGlobalSummary(query: GlobalDashboardQuery): Promise<GlobalDashboardSummary> {
        return this.dashboardRepository.getGlobalSummary(query);
    }
}
