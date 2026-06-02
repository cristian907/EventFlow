export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export interface TicketSummaryType {
    id: string;
    eventId: string;
    orderId: string;
    orderItemId: string;
    customerId: string;
    ticketTypeId: string;
    ticketTypeName: string;
    customerName: string;
    qrCode: string;
    status: TicketStatus;
    issuedAt: string;
    usedAt?: string;
}

export interface TicketListResponse {
    tickets: TicketSummaryType[];
}

export interface TicketVerifyResult {
    valid: boolean;
    ticketId?: string;
    message: string;
}
