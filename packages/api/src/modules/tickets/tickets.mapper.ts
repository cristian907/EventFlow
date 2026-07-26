import { TicketSummaryType } from '@eventflow/shared';

import Ticket from '../../core/entities/Ticket';

export default class TicketsMapper {
    static toSummary(ticket: Ticket): TicketSummaryType {
        return {
            id: ticket.id,
            eventId: ticket.eventId,
            orderId: ticket.orderId,
            orderItemId: ticket.orderItemId,
            customerId: ticket.customerId,
            ticketTypeId: ticket.ticketTypeId,
            ticketTypeName: ticket.ticketTypeName,
            customerName: ticket.customerName,
            qrCode: ticket.qrCode,
            status: ticket.status,
            issuedAt: ticket.issuedAt.toISOString(),
            usedAt: ticket.usedAt?.toISOString(),
        };
    }
}
