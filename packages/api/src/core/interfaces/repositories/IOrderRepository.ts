import Order from '../../entities/Order';
import { ITransactionContext } from '../ITransactionContext';

export interface OrderPaymentData {
    paymentMethodId: string;
    amount: number;
    currency: string;
    reference?: string;
    receiptUrl?: string;
    verifiedById: string;
}

export interface OrderCreateData {
    eventId: string;
    customerId: string;
    soldById: string;
    exchangeRateId: string;
    totalAmount: number;
    ticketTypeId: string;
    quantity: number;
    unitPrice: number;
    itemCurrency: string;
    subtotal: number;
    payments: OrderPaymentData[];
}

export interface OrderFilters {
    page?: number;
    limit?: number;
    idNumber?: string;
    startDate?: string;
    endDate?: string;
    ticketTypeId?: string;
}

export default interface IOrderRepository {
    create(data: OrderCreateData, tx?: ITransactionContext): Promise<Order>;
    findAndCount(
        eventId: string,
        filters: OrderFilters,
    ): Promise<{ orders: Order[]; total: number }>;
    findById(eventId: string, orderId: string): Promise<Order | null>;
}
