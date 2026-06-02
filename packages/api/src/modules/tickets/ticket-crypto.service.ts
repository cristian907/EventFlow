import crypto from 'node:crypto';

export interface QrPayload {
    qrCode: string;
    eventId: string;
    ticketTypeId: string;
}

export default class TicketCryptoService {
    constructor(private readonly qrSecret: string) {}

    generateQrCode(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    signPayload(payload: QrPayload): string {
        const data = JSON.stringify(payload);
        return crypto.createHmac('sha256', this.qrSecret).update(data).digest('hex');
    }

    verifySignature(payload: QrPayload, signature: string): boolean {
        const expected = this.signPayload(payload);
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    }

    encodeQrData(payload: QrPayload, signature: string): string {
        const qrData = { ...payload, signature };
        return Buffer.from(JSON.stringify(qrData)).toString('base64');
    }

    decodeQrData(base64: string): { payload: QrPayload; signature: string } {
        const json = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        const { signature, ...payload } = json;
        return { payload: payload as QrPayload, signature: signature as string };
    }
}
