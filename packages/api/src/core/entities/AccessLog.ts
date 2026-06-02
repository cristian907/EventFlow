export type AccessResult = 'VALID' | 'ALREADY_USED' | 'INVALID';
export type AccessMethod = 'QR' | 'MANUAL';

export default class AccessLog {
    constructor(
        public readonly id: string,
        public readonly eventId: string,
        public readonly ticketId: string | null,
        public readonly scannedById: string,
        public readonly result: AccessResult,
        public readonly method: AccessMethod,
        public readonly scannedAt: Date,
    ) {}
}
