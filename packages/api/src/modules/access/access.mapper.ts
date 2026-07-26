import { AccessLogEntry, AccessSearchTicket, AccessTicketInfo } from '@eventflow/shared';

import Ticket from '../../core/entities/Ticket';
import { AccessLogWithDetails } from '../../core/interfaces/repositories/IAccessLogRepository';

export default class AccessMapper {
    static toTicketInfo(ticket: Ticket): AccessTicketInfo {
        return {
            id: ticket.id,
            ticketTypeName: ticket.ticketTypeName,
            customerName: ticket.customerName,
            status: ticket.status,
            usedAt: ticket.usedAt?.toISOString(),
        };
    }

    static toSearchTicket(ticket: Ticket): AccessSearchTicket {
        return {
            id: ticket.id,
            ticketTypeName: ticket.ticketTypeName,
            customerName: ticket.customerName,
            status: ticket.status,
            issuedAt: ticket.issuedAt.toISOString(),
            usedAt: ticket.usedAt?.toISOString(),
        };
    }

    static toLogEntry(log: AccessLogWithDetails): AccessLogEntry {
        return {
            id: log.id,
            ticketId: log.ticketId,
            scannedByName: log.scannedByName,
            result: log.result,
            method: log.method,
            scannedAt: log.scannedAt.toISOString(),
            ticketTypeName: log.ticketTypeName,
            customerName: log.customerName,
        };
    }
}
