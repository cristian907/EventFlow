import { EventDashboardSummary } from '@eventflow/shared';

export default interface IDashboardRepository {
    getSummary(eventId: string): Promise<EventDashboardSummary>;
}
