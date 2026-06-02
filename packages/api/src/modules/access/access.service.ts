import {
    AccessLogListResponse,
    AccessSearchResponse,
    AccessVerifyResponse,
} from '@eventflow/shared';

import IAccessLogRepository from '../../core/interfaces/repositories/IAccessLogRepository';
import ITicketRepository from '../../core/interfaces/repositories/ITicketRepository';
import TicketCryptoService from '../tickets/ticket-crypto.service';

import AccessMapper from './access.mapper';

export default class AccessService {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly accessLogRepository: IAccessLogRepository,
        private readonly cryptoService: TicketCryptoService,
    ) {}

    async scanQr(
        eventId: string,
        qrDataBase64: string,
        scannedById: string,
    ): Promise<AccessVerifyResponse> {
        let decoded: {
            payload: { qrCode: string; eventId: string; ticketTypeId: string };
            signature: string;
        };
        try {
            decoded = this.cryptoService.decodeQrData(qrDataBase64);
        } catch {
            await this.accessLogRepository.create({
                eventId,
                scannedById,
                result: 'INVALID',
                method: 'QR',
            });
            return { result: 'invalid', message: 'Código QR no válido.' };
        }

        const { payload, signature } = decoded;

        if (!this.cryptoService.verifySignature(payload, signature)) {
            await this.accessLogRepository.create({
                eventId,
                scannedById,
                result: 'INVALID',
                method: 'QR',
            });
            return { result: 'invalid', message: 'Firma del QR inválida.' };
        }

        if (payload.eventId !== eventId) {
            await this.accessLogRepository.create({
                eventId,
                scannedById,
                result: 'INVALID',
                method: 'QR',
            });
            return { result: 'invalid', message: 'El ticket no pertenece a este evento.' };
        }

        const ticket = await this.ticketRepository.markAsUsed(payload.qrCode);
        if (ticket) {
            await this.accessLogRepository.create({
                eventId,
                ticketId: ticket.id,
                scannedById,
                result: 'VALID',
                method: 'QR',
            });
            return {
                result: 'valid',
                ticket: AccessMapper.toTicketInfo(ticket),
                message: 'Entrada válida.',
            };
        }

        return this.resolveFailedMark(eventId, scannedById, 'QR', payload.qrCode);
    }

    async searchByIdNumber(eventId: string, idNumber: string): Promise<AccessSearchResponse> {
        const tickets = await this.ticketRepository.findByCustomerIdNumberAndEvent(
            eventId,
            idNumber,
        );

        if (tickets.length === 0) {
            return { customer: null, tickets: [] };
        }

        return {
            customer: {
                id: tickets[0].customerId,
                idNumber,
                fullName: tickets[0].customerName,
            },
            tickets: tickets.map(AccessMapper.toSearchTicket),
        };
    }

    async manualUse(
        eventId: string,
        ticketId: string,
        scannedById: string,
    ): Promise<AccessVerifyResponse> {
        const ticket = await this.ticketRepository.markAsUsedById(eventId, ticketId);
        if (ticket) {
            await this.accessLogRepository.create({
                eventId,
                ticketId: ticket.id,
                scannedById,
                result: 'VALID',
                method: 'MANUAL',
            });
            return {
                result: 'valid',
                ticket: AccessMapper.toTicketInfo(ticket),
                message: 'Entrada marcada como usada.',
            };
        }

        const existing = await this.ticketRepository.findById(eventId, ticketId);
        if (!existing) {
            await this.accessLogRepository.create({
                eventId,
                scannedById,
                result: 'INVALID',
                method: 'MANUAL',
            });
            return { result: 'invalid', message: 'Ticket no encontrado en este evento.' };
        }

        if (existing.status === 'CANCELLED') {
            await this.accessLogRepository.create({
                eventId,
                ticketId: existing.id,
                scannedById,
                result: 'INVALID',
                method: 'MANUAL',
            });
            return {
                result: 'cancelled',
                ticket: AccessMapper.toTicketInfo(existing),
                message: 'Este ticket fue cancelado.',
            };
        }

        await this.accessLogRepository.create({
            eventId,
            ticketId: existing.id,
            scannedById,
            result: 'ALREADY_USED',
            method: 'MANUAL',
        });
        return {
            result: 'already_used',
            ticket: AccessMapper.toTicketInfo(existing),
            message: 'Este ticket ya fue usado.',
        };
    }

    async getLogs(eventId: string, page: number, limit: number): Promise<AccessLogListResponse> {
        const { logs, total } = await this.accessLogRepository.findByEvent(eventId, page, limit);
        return {
            logs: logs.map(AccessMapper.toLogEntry),
            total,
        };
    }

    private async resolveFailedMark(
        eventId: string,
        scannedById: string,
        method: 'QR' | 'MANUAL',
        qrCode: string,
    ): Promise<AccessVerifyResponse> {
        const existing = await this.ticketRepository.findByQrCode(qrCode);

        if (!existing) {
            await this.accessLogRepository.create({
                eventId,
                scannedById,
                result: 'INVALID',
                method,
            });
            return { result: 'invalid', message: 'Ticket no encontrado.' };
        }

        if (existing.status === 'CANCELLED') {
            await this.accessLogRepository.create({
                eventId,
                ticketId: existing.id,
                scannedById,
                result: 'INVALID',
                method,
            });
            return {
                result: 'cancelled',
                ticket: AccessMapper.toTicketInfo(existing),
                message: 'Este ticket fue cancelado.',
            };
        }

        await this.accessLogRepository.create({
            eventId,
            ticketId: existing.id,
            scannedById,
            result: 'ALREADY_USED',
            method,
        });
        return {
            result: 'already_used',
            ticket: AccessMapper.toTicketInfo(existing),
            message: 'Este ticket ya fue usado.',
        };
    }
}
