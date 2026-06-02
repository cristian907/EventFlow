import AccessLog, { AccessMethod, AccessResult } from '../../entities/AccessLog';

export interface AccessLogCreateData {
    eventId: string;
    ticketId?: string;
    scannedById: string;
    result: AccessResult;
    method: AccessMethod;
}

export interface AccessLogWithDetails {
    id: string;
    ticketId: string | null;
    scannedByName: string;
    result: string;
    method: string;
    scannedAt: Date;
    ticketTypeName?: string;
    customerName?: string;
}

export default interface IAccessLogRepository {
    create(data: AccessLogCreateData): Promise<AccessLog>;
    findByEvent(
        eventId: string,
        page: number,
        limit: number,
    ): Promise<{ logs: AccessLogWithDetails[]; total: number }>;
}
