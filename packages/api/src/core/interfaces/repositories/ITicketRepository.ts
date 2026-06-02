import Ticket from '../../entities/Ticket';
import { ITransactionContext } from '../ITransactionContext';

export interface TicketCreateData {
    eventId: string;
    orderId: string;
    orderItemId: string;
    customerId: string;
    ticketTypeId: string;
    qrCode: string;
    qrSignature: string;
}

export default interface ITicketRepository {
    createMany(data: TicketCreateData[], tx?: ITransactionContext): Promise<Ticket[]>;
    findByOrderId(eventId: string, orderId: string): Promise<Ticket[]>;
    findById(eventId: string, ticketId: string): Promise<Ticket | null>;
    countByOrderId(orderId: string, tx?: ITransactionContext): Promise<number>;
    markAsUsed(qrCode: string): Promise<Ticket | null>;
    findByQrCode(qrCode: string): Promise<Ticket | null>;
    findByCustomerIdNumberAndEvent(eventId: string, idNumber: string): Promise<Ticket[]>;
    markAsUsedById(eventId: string, ticketId: string): Promise<Ticket | null>;
}
