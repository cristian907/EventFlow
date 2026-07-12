import {
    EventDashboardSummary,
    GlobalDashboardSummary,
    GlobalDashboardQuery,
} from '@eventflow/shared';

export default interface IDashboardRepository {
    getSummary(eventId: string): Promise<EventDashboardSummary>;
    getGlobalSummary(query: GlobalDashboardQuery): Promise<GlobalDashboardSummary>;
}
