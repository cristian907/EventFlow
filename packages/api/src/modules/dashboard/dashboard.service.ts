import { EventDashboardSummary } from '@eventflow/shared';

import IDashboardRepository from '../../core/interfaces/repositories/IDashboardRepository';

export default class DashboardService {
    constructor(private readonly dashboardRepository: IDashboardRepository) {}

    async getSummary(eventId: string): Promise<EventDashboardSummary> {
        return this.dashboardRepository.getSummary(eventId);
    }
}
