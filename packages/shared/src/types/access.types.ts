export type AccessResultType = 'valid' | 'already_used' | 'cancelled' | 'invalid';
export type AccessMethodType = 'scan' | 'manual';

export interface AccessTicketInfo {
    id: string;
    ticketTypeName: string;
    customerName: string;
    status: string;
    usedAt?: string;
}

export interface AccessVerifyResponse {
    result: AccessResultType;
    ticket?: AccessTicketInfo;
    message: string;
}

export interface AccessSearchTicket {
    id: string;
    ticketTypeName: string;
    customerName: string;
    status: 'VALID' | 'USED' | 'CANCELLED';
    issuedAt: string;
    usedAt?: string;
}

export interface AccessSearchResponse {
    customer: {
        id: string;
        idNumber: string;
        fullName: string;
    } | null;
    tickets: AccessSearchTicket[];
}

export interface AccessLogEntry {
    id: string;
    ticketId: string | null;
    scannedByName: string;
    result: string;
    method: string;
    scannedAt: string;
    ticketTypeName?: string;
    customerName?: string;
}

export interface AccessLogListResponse {
    logs: AccessLogEntry[];
    total: number;
}
