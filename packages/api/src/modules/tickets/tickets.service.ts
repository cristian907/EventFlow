import { TicketListResponse } from '@eventflow/shared';

import Ticket from '../../core/entities/Ticket';
import {
    InvalidQrSignatureError,
    TicketAlreadyUsedError,
    TicketEventMismatchError,
    TicketNotFoundError,
} from '../../core/errors/BusinessErrors';
import { ITransactionContext } from '../../core/interfaces/ITransactionContext';
import ITicketRepository from '../../core/interfaces/repositories/ITicketRepository';

import TicketCryptoService from './ticket-crypto.service';
import TicketsMapper from './tickets.mapper';

export interface OrderItemForEmission {
    orderItemId: string;
    ticketTypeId: string;
    quantity: number;
}

export default class TicketsService {
    constructor(
        private readonly ticketRepository: ITicketRepository,
        private readonly cryptoService: TicketCryptoService,
    ) {}

    async emitTicketsForOrder(
        eventId: string,
        orderId: string,
        customerId: string,
        items: OrderItemForEmission[],
        tx: ITransactionContext,
    ): Promise<Ticket[]> {
        const existing = await this.ticketRepository.countByOrderId(orderId, tx);
        if (existing > 0) return [];

        const ticketDataList = [];

        for (const item of items) {
            for (let i = 0; i < item.quantity; i++) {
                const qrCode = this.cryptoService.generateQrCode();
                const payload = {
                    qrCode,
                    eventId,
                    ticketTypeId: item.ticketTypeId,
                };
                const qrSignature = this.cryptoService.signPayload(payload);
                ticketDataList.push({
                    eventId,
                    orderId,
                    orderItemId: item.orderItemId,
                    customerId,
                    ticketTypeId: item.ticketTypeId,
                    qrCode,
                    qrSignature,
                });
            }
        }

        return this.ticketRepository.createMany(ticketDataList, tx);
    }

    async listByOrder(eventId: string, orderId: string): Promise<TicketListResponse> {
        const tickets = await this.ticketRepository.findByOrderId(eventId, orderId);
        return { tickets: tickets.map(TicketsMapper.toSummary) };
    }

    async getTicketForDownload(
        eventId: string,
        ticketId: string,
    ): Promise<{ ticket: Ticket; qrBase64: string }> {
        const ticket = await this.ticketRepository.findById(eventId, ticketId);
        if (!ticket) throw new TicketNotFoundError(ticketId);

        const payload = {
            qrCode: ticket.qrCode,
            eventId: ticket.eventId,
            ticketTypeId: ticket.ticketTypeId,
        };
        const qrBase64 = this.cryptoService.encodeQrData(payload, ticket.qrSignature);
        return { ticket, qrBase64 };
    }

    async verifyAndMarkUsed(eventId: string, qrDataBase64: string): Promise<Ticket> {
        let decoded: {
            payload: { qrCode: string; eventId: string; ticketTypeId: string };
            signature: string;
        };
        try {
            decoded = this.cryptoService.decodeQrData(qrDataBase64);
        } catch {
            throw new InvalidQrSignatureError();
        }

        const { payload, signature } = decoded;
        const valid = this.cryptoService.verifySignature(payload, signature);
        if (!valid) throw new InvalidQrSignatureError();

        if (payload.eventId !== eventId) throw new TicketEventMismatchError();

        const ticket = await this.ticketRepository.markAsUsed(payload.qrCode);
        if (!ticket) throw new TicketAlreadyUsedError();
        return ticket;
    }
}
