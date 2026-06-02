export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';

export default class Ticket {
    constructor(
        public readonly id: string,
        public readonly eventId: string,
        public readonly orderId: string,
        public readonly orderItemId: string,
        public readonly customerId: string,
        public readonly ticketTypeId: string,
        public readonly ticketTypeName: string,
        public readonly customerName: string,
        public readonly qrCode: string,
        public readonly qrSignature: string,
        public readonly status: TicketStatus,
        public readonly issuedAt: Date,
        public readonly usedAt: Date | null,
    ) {}
}
